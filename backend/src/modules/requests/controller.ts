import { Request as ExpressRequest, Response } from 'express';
import { z } from 'zod';
import { createDraft, listRequests, getRequestById } from './service';

// NOTE: we alias Express's Request as ExpressRequest because we also have
// our own Request Mongoose model — avoids naming collision.

const createDraftSchema = z.object({
  projectName: z.string().min(1),
  city: z.string().min(1),
  projectType: z.enum(['Sample', 'Démo', 'Salon', 'AO']),
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