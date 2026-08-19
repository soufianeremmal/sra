import { Types } from 'mongoose';
import { Request, IRequest, RequestStatus } from './models/request.model';
import { AuditLog } from './models/audit-log.model';
import { canTransition } from './state-machine';
import { generateChecklistForRequest, isChecklistComplete, countUncheckedItems } from '../checklist/service';
import { notifyRequestSubmitted } from '../notifications/notify-request-submitted.service';
import { notifyStatusChanged } from '../notifications/notify-status-changed.service';
import { User } from '../auth/model';
export class TransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransitionError';
  }
}

export async function createDraft(input: {
  requesterId: string;
  projectName: string;
  city: string;
  projectType: 'Sample' | 'Démo' | 'Salon' | 'AO';
}): Promise<IRequest> {
  const doc = await Request.create({
    projectName: input.projectName,
    city: input.city,
    projectType: input.projectType,
    requester: new Types.ObjectId(input.requesterId),
    status: 'Draft',
    logistics: { deliverByRequester: false },
    bikes: [],
    accessories: {},
  });

  await AuditLog.create({
    requestId: doc._id,
    action: 'created',
    byUser: new Types.ObjectId(input.requesterId),
    comment: 'Draft created',
  });

  return doc;
}

// Parameter prefixed with _ to signal "unused for now, will be used later for per-user filtering"
export async function listRequests(_currentUser: { userId: string; role: string }) {
  return Request.find()
    .populate('requester', 'name email role')
    .sort({ createdAt: -1 });
}

export async function getRequestById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Request.findById(id).populate('requester', 'name email role');
}

export async function changeStatus(input: {
  requestId: string;
  newStatus: RequestStatus;
  actorId: string;
  comment: string;
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new TransitionError('Invalid request id');
  }

  const doc = await Request.findById(input.requestId);
  if (!doc) throw new TransitionError('Request not found');

  if (!canTransition(doc.status, input.newStatus)) {
    throw new TransitionError(
      `Illegal transition: ${doc.status} → ${input.newStatus}`
    );
  }

  // GATE: cannot move to "Prêt à enlever" unless checklist is complete
  if (input.newStatus === 'Prêt à enlever') {
    const complete = await isChecklistComplete(doc._id);
    if (!complete) {
      const missing = await countUncheckedItems(doc._id);
      throw new TransitionError(
        `Checklist incomplete — ${missing} item${missing > 1 ? 's' : ''} still unchecked`
      );
    }
  }

  const previousStatus = doc.status;
  doc.status = input.newStatus;
  await doc.save();

  // HOOK: generate checklist the first time this request enters "En cours"
  if (input.newStatus === 'En cours') {
    await generateChecklistForRequest(doc._id, input.actorId);
  }

  await AuditLog.create({
    requestId: doc._id,
    action:
      input.newStatus === 'À faire' && previousStatus === 'Draft'
        ? 'submitted'
        : 'status_changed',
    byUser: new Types.ObjectId(input.actorId),
    comment: input.comment,
    metadata: { fromStatus: previousStatus, toStatus: input.newStatus },
  });
  // Fire notifications (fire-and-forget, never blocks the response)
  const requester = await User.findById(doc.requester);
  if (requester) {
    if (input.newStatus === 'À faire' && previousStatus === 'Draft') {
      // Submission — notify the sampling team (channel + email + Notion)
      notifyRequestSubmitted({ request: doc, requester });
    } else {
      // Ongoing status change — notify the requester
      notifyStatusChanged({
        request: doc,
        requester,
        previousStatus,
        comment: input.comment,
      });
    }
  }

  return doc;
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

// Fields Marketing is allowed to update. Everything else is forbidden.
// Kept as an explicit list, not derived from the schema, so nobody adds a
// sensitive field to the model and accidentally makes it Marketing-writable.
const MARKETING_EDITABLE_FIELDS = [
  'projectName',
  'city',
  'projectType',
  'logistics',
  'bikes',
  'station',
  'accessories',
  'comment',
] as const;

type MarketingEditableField = (typeof MARKETING_EDITABLE_FIELDS)[number];
type MarketingUpdatePayload = Partial<Pick<IRequest, MarketingEditableField>>;

export async function updateRequestFields(input: {
  requestId: string;
  actorId: string;
  updates: MarketingUpdatePayload;
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new PermissionError('Invalid request id');
  }

  const doc = await Request.findById(input.requestId);
  if (!doc) throw new PermissionError('Request not found');

  if (doc.status === 'Terminé') {
    throw new PermissionError('This request is finalized and cannot be edited');
  }

  // Enforce: whatever the client sent, only apply keys that are in our allow-list.
  // This is defense-in-depth on top of Zod validation.
  const applied: string[] = [];
  for (const key of MARKETING_EDITABLE_FIELDS) {
    if (key in input.updates && input.updates[key] !== undefined) {
      // Cast is safe here — TS can't see through the string index, but the allow-list guarantees the shape.
      (doc as unknown as Record<string, unknown>)[key] = input.updates[key];
      applied.push(key);
    }
  }

  if (applied.length === 0) {
    // Client sent a body but nothing valid to update — return the doc unchanged
    return doc;
  }

  await doc.save();

  await AuditLog.create({
    requestId: doc._id,
    action: 'field_updated',
    byUser: new Types.ObjectId(input.actorId),
    comment: `Updated fields: ${applied.join(', ')}`,
    metadata: { updatedFields: applied },
  });

  return doc;
}

export async function deleteRequest(input: {
  requestId: string;
  actor: { userId: string; role: string };
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new PermissionError('Invalid request id');
  }

  const doc = await Request.findById(input.requestId);
  if (!doc) throw new PermissionError('Request not found');

  const isSampling = input.actor.role === 'sampling_admin';
  const isOwnDraft =
    doc.status === 'Draft' &&
    doc.requester.toString() === input.actor.userId;

  if (!isSampling && !isOwnDraft) {
    throw new PermissionError('You cannot delete this request');
  }

  await AuditLog.create({
    requestId: doc._id,
    action: 'deleted',
    byUser: new Types.ObjectId(input.actor.userId),
    comment: isSampling ? 'Deleted by Sampling' : 'Draft deleted by requester',
    metadata: { statusAtDeletion: doc.status },
  });

  await doc.deleteOne();
  return { deleted: true };
}