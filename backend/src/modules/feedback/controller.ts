import { Request as ExpressRequest, Response } from 'express';
import { z } from 'zod';
import { createFeedback, listFeedback, FeedbackError } from './service';

const createSchema = z.object({
  category: z.enum(['Bug', 'Suggestion', 'Process issue']),
  text: z.string().min(1, 'Text is required'),
  requestId: z.string().optional(),
});

export async function create(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const doc = await createFeedback({
      authorId: req.user.userId,
      category: parsed.data.category,
      text: parsed.data.text,
      requestId: parsed.data.requestId,
    });
    return res.status(201).json(doc);
  } catch (err) {
    if (err instanceof FeedbackError) return res.status(400).json({ error: err.message });
    throw err;
  }
}

export async function list(req: ExpressRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const items = await listFeedback(req.user);
  return res.json(items);
}