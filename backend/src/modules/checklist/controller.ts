import { Request as ExpressRequest, Response } from 'express';
import { z } from 'zod';
import { listForRequest, toggleItem, ChecklistError } from './service';

const toggleSchema = z.object({
  checked: z.boolean(),
  note: z.string().optional(),
});

export async function list(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const items = await listForRequest(req.params.id);
  return res.json(items);
}

export async function toggle(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = toggleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const item = await toggleItem({
      itemId: req.params.itemId,
      checked: parsed.data.checked,
      note: parsed.data.note,
      actorId: req.user.userId,
    });
    return res.json(item);
  } catch (err) {
    if (err instanceof ChecklistError) return res.status(400).json({ error: err.message });
    throw err;
  }
}