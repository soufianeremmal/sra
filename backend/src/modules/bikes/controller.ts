import { Request as ExpressRequest, Response } from 'express';
import { z } from 'zod';
import {
  syncBikeInventory,
  listInventory,
  getAvailability,
  assignBikeToRequest,
  unassignBikeFromRequest,
  listAssignmentsForRequest,
  BikeError,
} from './service';

const assignSchema = z.object({
  sn: z.string().min(1),
});

export async function inventory(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const items = await listInventory();
  return res.json(items);
}

export async function availability(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const grouped = await getAvailability();
  return res.json(grouped);
}

export async function sync(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const result = await syncBikeInventory();
  return res.json(result);
}

export async function assign(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const assignment = await assignBikeToRequest({
      requestId: req.params.id,
      sn: parsed.data.sn,
      actorId: req.user.userId,
    });
    return res.status(201).json(assignment);
  } catch (err) {
    if (err instanceof BikeError) return res.status(400).json({ error: err.message });
    throw err;
  }
}

export async function unassign(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const result = await unassignBikeFromRequest({
      requestId: req.params.id,
      sn: req.params.sn,
      actorId: req.user.userId,
    });
    return res.json(result);
  } catch (err) {
    if (err instanceof BikeError) return res.status(400).json({ error: err.message });
    throw err;
  }
}

export async function listForRequest(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const items = await listAssignmentsForRequest(req.params.id);
  return res.json(items);
}