import { Request as ExpressRequest, Response } from 'express';
import { z } from 'zod';
import {
  createDraft,
  listRequests,
  getRequestById,
  changeStatus,
  updateRequestFields,
  deleteRequest,
  listAuditForRequest,
  TransitionError,
  PermissionError,
} from './service';
import { generateClientEmailForRequest } from '../notifications/email-generator.service';
import { User } from '../auth/model';
// NOTE: we alias Express's Request as ExpressRequest because we also have
// our own Request Mongoose model — avoids naming collision.

// All fields optional — Marketing PATCHes partially, only sends what changed
const updateFieldsSchema = z.object({
  projectName: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  projectType: z.enum(['Sample', 'Démo', 'Salon', 'AO']).optional(),
  logistics: z.object({
    deliverByRequester: z.boolean().optional(),
    companyName: z.string().optional(),
    deliveryContactName: z.string().optional(),
    deliveryContactPhone: z.string().optional(),
    deliveryAddress: z.string().optional(),
    deliveryLatestDate: z.coerce.date().optional(),
    deliveryTimeSlot: z.string().optional(),
    returnDate: z.coerce.date().optional(),
    returnTimeSlot: z.string().optional(),
  }).optional(),
  bikes: z.array(z.object({
    bikeType: z.enum(['Fusion 1', 'Fusion 1.5', 'Fusion 2']),
    stickersType: z.enum(['Standard', 'Custom', 'None']),
    luggageRack: z.boolean(),
    heavyLock: z.boolean(),
    lockTo: z.enum(['Frame', 'Front wheel', 'Both']),
  })).optional(),
  station: z.object({
    stationNeeded: z.boolean(),
    equipment: z.array(z.object({
      type: z.enum(['e-Dock', 'Maintenance dock', 'Totem', 'Weight plate', 'Guiding band', 'Stickers']),
      quantity: z.number().int().min(0),
      needsCharging: z.boolean().optional(),
    })).optional(),
  }).optional(),
  accessories: z.object({
    phone: z.number().int().min(0).optional(),
    batteryCharger: z.number().int().min(0).optional(),
    additionalBattery: z.number().int().min(0).optional(),
    rfidCard: z.number().int().min(0).optional(),
    marketingMaterial: z.array(z.object({
      item: z.string().min(1),
      quantity: z.number().int().min(0),
    })).optional(),
  }).optional(),
  comment: z.string().optional(),
});

const createDraftSchema = z.object({
  projectName: z.string().min(1),
  city: z.string().min(1),
  projectType: z.enum(['Sample', 'Démo', 'Salon', 'AO']),
});

const changeStatusSchema = z.object({
  newStatus: z.enum([
    'Draft',
    'À faire',
    'En cours',
    'Prêt à tester',
    'Emballé',
    'Prêt à enlever',
    'Expédié',
    'Terminé',
  ]),
  comment: z.string().min(1, 'Comment is required for every status change'),
});

const submitSchema = z.object({
  comment: z.string().min(1, 'Comment is required to submit'),
});

export async function create(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = createDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  const doc = await createDraft({
    requesterId: req.user.userId,
    ...parsed.data,
  });

  return res.status(201).json(doc);
}

export async function list(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const items = await listRequests(req.user);
  return res.json(items);
}

export async function getOne(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const doc = await getRequestById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Request not found' });

  return res.json(doc);
}

export async function submit(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const doc = await changeStatus({
      requestId: req.params.id,
      newStatus: 'À faire',
      actorId: req.user.userId,
      comment: parsed.data.comment,
    });
    return res.json(doc);
  } catch (err) {
    if (err instanceof TransitionError) return res.status(400).json({ error: err.message });
    throw err;
  }
}

export async function updateStatus(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = changeStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const doc = await changeStatus({
      requestId: req.params.id,
      newStatus: parsed.data.newStatus,
      actorId: req.user.userId,
      comment: parsed.data.comment,
    });
    return res.json(doc);
  } catch (err) {
    if (err instanceof TransitionError) return res.status(400).json({ error: err.message });
    throw err;
  }
}
export async function update(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = updateFieldsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const doc = await updateRequestFields({
      requestId: req.params.id,
      actorId: req.user.userId,
      updates: parsed.data,
    });
    return res.json(doc);
  } catch (err) {
    if (err instanceof PermissionError) return res.status(403).json({ error: err.message });
    throw err;
  }
}

export async function remove(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const result = await deleteRequest({
      requestId: req.params.id,
      actor: req.user,
    });
    return res.json(result);
  } catch (err) {
    if (err instanceof PermissionError) return res.status(403).json({ error: err.message });
    throw err;
  }
}
export async function generateEmail(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const doc = await getRequestById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Request not found' });

  const requester = await User.findById(doc.requester);
  if (!requester) return res.status(404).json({ error: 'Requester not found' });

  const email = generateClientEmailForRequest({ request: doc, requester });
  return res.json(email);
}
export async function audit(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const doc = await getRequestById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Request not found' });

  const entries = await listAuditForRequest(req.params.id);
  return res.json(entries);
}