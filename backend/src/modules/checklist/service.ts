import { Types } from 'mongoose';
import { ChecklistItem, IChecklistItem } from './models/checklist-item.model';
import { CHECKLIST_TEMPLATE } from './templates';
import { AuditLog } from '../requests/models/audit-log.model';

export class ChecklistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChecklistError';
  }
}

/**
 * Generate a checklist for a request from the template.
 * Called by the state machine when a request first enters "En cours".
 * Safe to call multiple times — refuses to re-generate if one already exists.
 */
export async function generateChecklistForRequest(
  requestId: Types.ObjectId,
  actorId: string
) {
  const existing = await ChecklistItem.countDocuments({ requestId });
  if (existing > 0) {
    // Already generated — don't duplicate. Silent, not an error.
    return;
  }

  const docs = CHECKLIST_TEMPLATE.map((item, index) => ({
    requestId,
    category: item.category,
    label: item.label,
    order: index,
    checked: false,
  }));

  await ChecklistItem.insertMany(docs);

  await AuditLog.create({
    requestId,
    action: 'field_updated', // no dedicated "checklist_created" action; using generic
    byUser: new Types.ObjectId(actorId),
    comment: `Checklist generated (${docs.length} items)`,
    metadata: { checklistItemCount: docs.length },
  });
}

export async function listForRequest(requestId: string): Promise<IChecklistItem[]> {
  if (!Types.ObjectId.isValid(requestId)) return [];
  return ChecklistItem.find({ requestId: new Types.ObjectId(requestId) }).sort({ order: 1 });
}

export async function toggleItem(input: {
  itemId: string;
  checked: boolean;
  note?: string;
  actorId: string;
}) {
  if (!Types.ObjectId.isValid(input.itemId)) {
    throw new ChecklistError('Invalid checklist item id');
  }

  const item = await ChecklistItem.findById(input.itemId);
  if (!item) throw new ChecklistError('Checklist item not found');

  item.checked = input.checked;
  if (input.note !== undefined) item.note = input.note;

  if (input.checked) {
    item.checkedBy = new Types.ObjectId(input.actorId);
    item.checkedAt = new Date();
  } else {
    // Unchecking — clear the tracking fields
    item.checkedBy = undefined;
    item.checkedAt = undefined;
  }

  await item.save();

  await AuditLog.create({
    requestId: item.requestId,
    action: 'field_updated',
    byUser: new Types.ObjectId(input.actorId),
    comment: `Checklist item ${input.checked ? 'checked' : 'unchecked'}: "${item.label}"`,
    metadata: {
      itemId: item._id.toString(),
      category: item.category,
      label: item.label,
      checked: input.checked,
    },
  });

  return item;
}

/**
 * Returns true if every checklist item for this request is checked.
 * Called by the state machine to enforce the "Prêt à enlever" gate.
 * Returns true (skip gate) if no checklist exists — meaning the request
 * hasn't entered "En cours" yet, which shouldn't happen for this transition
 * but we fail-safe rather than blocking incorrectly.
 */
export async function isChecklistComplete(requestId: Types.ObjectId): Promise<boolean> {
  const total = await ChecklistItem.countDocuments({ requestId });
  if (total === 0) return true;

  const unchecked = await ChecklistItem.countDocuments({ requestId, checked: false });
  return unchecked === 0;
}

export async function countUncheckedItems(requestId: Types.ObjectId): Promise<number> {
  return ChecklistItem.countDocuments({ requestId, checked: false });
}