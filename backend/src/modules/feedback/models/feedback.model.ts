import { Schema, model, Document, Types } from 'mongoose';

export type FeedbackCategory = 'Bug' | 'Suggestion' | 'Process issue';

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  category: FeedbackCategory;
  text: string;
  requestId?: Types.ObjectId;   // optional — feedback can reference a specific Request
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['Bug', 'Suggestion', 'Process issue'],
      required: true,
    },
    text: { type: String, required: true, trim: true, minlength: 1 },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request' },
  },
  { timestamps: true }
);

export const Feedback = model<IFeedback>('Feedback', feedbackSchema);