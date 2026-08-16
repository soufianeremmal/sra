import { Types } from 'mongoose';
import { Request, IRequest } from './models/request.model';
import { AuditLog } from './models/audit-log.model';

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

export async function listRequests(currentUser: { userId: string; role: string }) {
  // Marketing sees all requests (per your design — 'Toutes les demandes' view)
  // Sampling also sees all requests
  // Both get the same list for now; per-user filtering can be added later
  return Request.find()
    .populate('requester', 'name email role')
    .sort({ createdAt: -1 });
}

export async function getRequestById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Request.findById(id).populate('requester', 'name email role');
}