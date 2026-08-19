import { Schema, model, Document, Types } from 'mongoose';

export interface IChecklistItem extends Document {
  _id: Types.ObjectId;
  requestId: Types.ObjectId;
  category: string;
  label: string;
  order: number;
  checked: boolean;
  checkedBy?: Types.ObjectId;
  checkedAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const checklistItemSchema = new Schema<IChecklistItem>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      index: true,
    },
    category: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    checked: { type: Boolean, required: true, default: false },
    checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ChecklistItem = model<IChecklistItem>('ChecklistItem', checklistItemSchema);