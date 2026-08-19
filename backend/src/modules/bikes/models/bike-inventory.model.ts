import { Schema, model, Document, Types } from 'mongoose';

// TODO: confirm the actual bike models with Product team
export type BikeModel = 'Fusion 1' | 'Fusion 1.5' | 'Fusion 2';

// Status of the physical bike itself, sourced from Notion
export type BikeInventoryStatus =
  | 'Available'
  | 'In repair'
  | 'On demo'
  | 'On AO'
  | 'On salon';

export interface IBikeInventory extends Document {
  _id: Types.ObjectId;
  sn: string;
  bikeModel: BikeModel;
  status: BikeInventoryStatus;
  fifteenControlUrl?: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bikeInventorySchema = new Schema<IBikeInventory>(
  {
    sn: { type: String, required: true, unique: true, trim: true, uppercase: true },
    bikeModel: {
      type: String,
      enum: ['Fusion 1', 'Fusion 1.5', 'Fusion 2'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'In repair', 'On demo', 'On AO', 'On salon'],
      required: true,
    },
    fifteenControlUrl: { type: String, trim: true },
    lastSyncedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export const BikeInventory = model<IBikeInventory>('BikeInventory', bikeInventorySchema);