import { Schema, model, Document, Types } from 'mongoose';
import { BikeModel } from './bike-inventory.model';

export interface IBikeAssignment extends Document {
  _id: Types.ObjectId;
  sn: string;
  model: BikeModel;                  // denormalized snapshot at assignment time
  fifteenControlUrl?: string;         // denormalized snapshot
  requestId: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedAt: Date;
}

const bikeAssignmentSchema = new Schema<IBikeAssignment>(
  {
    sn: { type: String, required: true, uppercase: true, trim: true },
    model: {
      type: String,
      enum: ['Fusion 1', 'Fusion 1.5', 'Fusion 2'],
      required: true,
    },
    fifteenControlUrl: { type: String, trim: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: false } }
);

// Compound uniqueness: a given SN can only be actively assigned once at a time.
// Combined with the "delete on request completion" cleanup, this enforces the rule.
bikeAssignmentSchema.index({ sn: 1 }, { unique: true });

export const BikeAssignment = model<IBikeAssignment>('BikeAssignment', bikeAssignmentSchema);