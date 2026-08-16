import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction =
  | 'created'
  | 'submitted'
  | 'status_changed'
  | 'field_updated'
  | 'bike_assigned'
  | 'deleted';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  requestId: Types.ObjectId;
  action: AuditAction;
  byUser: Types.ObjectId;
  comment?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
    action: {
      type: String,
      enum: ['created', 'submitted', 'status_changed', 'field_updated', 'bike_assigned', 'deleted'],
      required: true,
    },
    byUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);