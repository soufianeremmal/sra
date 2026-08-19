import { Schema, model, Document, Types } from 'mongoose';

// --- Enums / union types ---

export type RequestType = 'Sample' | 'Démo' | 'Salon' | 'AO';

export type RequestStatus =
  | 'Draft'
  | 'À faire'
  | 'En cours'
  | 'Prêt à tester'
  | 'Emballé'
  | 'Prêt à enlever'
  | 'Expédié'
  | 'Terminé';

// TODO: replace with real enum values once confirmed
export type BikeType = 'Fusion 1' | 'Fusion 1.5' | 'Fusion 2';
export type StickersType = 'Standard' | 'Custom' | 'None';
export type LockTo = 'Frame' | 'Front wheel' | 'Both';
export type StationType = 'e-dock' | 'Maintenance dock';

// --- Sub-schemas (embedded) ---

export interface IBikeLine {
  bikeType: BikeType;
  stickersType: StickersType;
  luggageRack: boolean;
  heavyLock: boolean;
  lockTo: LockTo;
}

const bikeLineSchema = new Schema<IBikeLine>(
  {
    bikeType: { type: String, enum: ['Fusion 1', 'Fusion 1.5', 'Fusion 2'], required: true },
    stickersType: { type: String, enum: ['Standard', 'Custom', 'None'], required: true },
    luggageRack: { type: Boolean, default: false },
    heavyLock: { type: Boolean, default: false },
    lockTo: { type: String, enum: ['Frame', 'Front wheel', 'Both'], required: true },
  },
  { _id: false }
);

export interface IMarketingMaterialItem {
  item: string;
  quantity: number;
}

const marketingMaterialItemSchema = new Schema<IMarketingMaterialItem>(
  {
    item: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

export interface IStationSection {
  stationNeeded: boolean;
  stationType?: StationType;
  needsCharging?: boolean;
  stationQuantity?: number;
  maintenanceDock?: number;
  weightPlate?: number;
  guidingBand?: number;
  stickers?: number;
  totem?: number;
}

const stationSectionSchema = new Schema<IStationSection>(
  {
    stationNeeded: { type: Boolean, default: false },
    stationType: { type: String, enum: ['e-dock', 'Maintenance dock'] },
    needsCharging: { type: Boolean },
    stationQuantity: { type: Number, min: 0 },
    maintenanceDock: { type: Number, min: 0 },
    weightPlate: { type: Number, min: 0 },
    guidingBand: { type: Number, min: 0 },
    stickers: { type: Number, min: 0 },
    totem: { type: Number, min: 0 },
  },
  { _id: false }
);

export interface IAccessoriesSection {
  phone?: number;
  batteryCharger?: number;
  additionalBattery?: number;
  rfidCard?: number;
  marketingMaterial?: IMarketingMaterialItem[];
}

const accessoriesSectionSchema = new Schema<IAccessoriesSection>(
  {
    phone: { type: Number, default: 0, min: 0 },
    batteryCharger: { type: Number, default: 0, min: 0 },
    additionalBattery: { type: Number, default: 0, min: 0 },
    rfidCard: { type: Number, default: 0, min: 0 },
    marketingMaterial: { type: [marketingMaterialItemSchema], default: [] },
  },
  { _id: false }
);

export interface ILogistics {
  deliverByRequester?: boolean;
  companyName?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  deliveryAddress?: string;
  deliveryLatestDate?: Date;
  deliveryTimeSlot?: string;
  returnDate?: Date;
  returnTimeSlot?: string;
}

const logisticsSchema = new Schema<ILogistics>(
  {
    deliverByRequester: { type: Boolean, default: false },
    companyName: { type: String, trim: true },
    deliveryContactName: { type: String, trim: true },
    deliveryContactPhone: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    deliveryLatestDate: { type: Date },
    deliveryTimeSlot: { type: String, trim: true },
    returnDate: { type: Date },
    returnTimeSlot: { type: String, trim: true },
  },
  { _id: false }
);

// --- Main Request document ---

export interface IRequest extends Document {
  _id: Types.ObjectId;
  projectName: string;
  city: string;
  projectType: RequestType;
  requester: Types.ObjectId; // ref User
  status: RequestStatus;
  logistics: ILogistics;
  bikes: IBikeLine[];
  station?: IStationSection;
  accessories: IAccessoriesSection;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>(
  {
    projectName: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    projectType: {
      type: String,
      enum: ['Sample', 'Démo', 'Salon', 'AO'],
      required: true,
    },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: [
        'Draft',
        'À faire',
        'En cours',
        'Prêt à tester',
        'Emballé',
        'Prêt à enlever',
        'Expédié',
        'Terminé',
      ],
      default: 'Draft',
    },
    logistics: { type: logisticsSchema, required: true, default: {} },
    bikes: { type: [bikeLineSchema], default: [] },
    station: { type: stationSectionSchema },
    accessories: { type: accessoriesSectionSchema, required: true, default: {} },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Request = model<IRequest>('Request', requestSchema);