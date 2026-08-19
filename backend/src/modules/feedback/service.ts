import { Types } from 'mongoose';
import { Feedback, FeedbackCategory, IFeedback } from './models/feedback.model';

export class FeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeedbackError';
  }
}

export async function createFeedback(input: {
  authorId: string;
  category: FeedbackCategory;
  text: string;
  requestId?: string;
}): Promise<IFeedback> {
  const payload: Record<string, unknown> = {
    author: new Types.ObjectId(input.authorId),
    category: input.category,
    text: input.text,
  };

  if (input.requestId) {
    if (!Types.ObjectId.isValid(input.requestId)) {
      throw new FeedbackError('Invalid request id');
    }
    payload.requestId = new Types.ObjectId(input.requestId);
  }

  return Feedback.create(payload);
}

/**
 * Lists feedback based on the caller's role.
 * - Sampling: sees everything (their "inbox")
 * - Marketing: sees only their own submissions
 */
export async function listFeedback(caller: { userId: string; role: string }) {
  const query = caller.role === 'sampling_admin'
    ? {}
    : { author: new Types.ObjectId(caller.userId) };

  return Feedback.find(query)
    .populate('author', 'name email role')
    .sort({ createdAt: -1 });
}