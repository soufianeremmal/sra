import { Types } from 'mongoose';
import { BikeInventory, BikeInventoryStatus } from './models/bike-inventory.model';
import { BikeAssignment } from './models/bike-assignment.model';
import { Request } from '../requests/models/request.model';
import { AuditLog } from '../requests/models/audit-log.model';
import { fetchBikesFromNotion } from '../../integrations/notion.client';

export class BikeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BikeError';
  }
}

// How stale we tolerate the inventory before triggering a re-sync
const INVENTORY_STALENESS_MINUTES = 15;

async function isInventoryStale(): Promise<boolean> {
  const newest = await BikeInventory.findOne().sort({ lastSyncedAt: -1 });
  if (!newest) return true;
  const staleness = Date.now() - newest.lastSyncedAt.getTime();
  return staleness > INVENTORY_STALENESS_MINUTES * 60 * 1000;
}

export async function syncBikeInventory() {
  const rows = await fetchBikesFromNotion();
  const now = new Date();

  // Upsert each bike — insert if new, update if it already exists.
  // We do this row by row instead of "clear and reinsert" so that
  // the _ids remain stable (nothing else references BikeInventory by _id right now,
  // but future-proofing costs nothing here).
  const results = await Promise.all(
    rows.map((row) =>
      BikeInventory.findOneAndUpdate(
        { sn: row.sn },
        {
          sn: row.sn,
          bikeModel: row.model,
          status: row.status,
          fifteenControlUrl: row.fifteenControlUrl,
          lastSyncedAt: now,
        },
        { upsert: true, returnDocument: 'after' }
      )
    )
  );

  return { syncedCount: results.length, syncedAt: now };
}

export async function ensureFreshInventory() {
  if (await isInventoryStale()) {
    await syncBikeInventory();
  }
}

export async function listInventory(filters?: { status?: BikeInventoryStatus }) {
  await ensureFreshInventory();

  const query: Record<string, unknown> = {};
  if (filters?.status) query.status = filters.status;

  return BikeInventory.find(query).sort({ sn: 1 });
}

export async function getAvailability() {
  await ensureFreshInventory();

  // Group inventory by status for the sampling dashboard tiles
  const grouped = await BikeInventory.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, bikes: { $push: { sn: '$sn', bikeModel: '$bikeModel' } } } },
    { $project: { _id: 0, status: '$_id', count: 1, bikes: 1 } },
  ]);

  return grouped;
}

export async function assignBikeToRequest(input: {
  requestId: string;
  sn: string;
  actorId: string;
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new BikeError('Invalid request id');
  }

  const request = await Request.findById(input.requestId);
  if (!request) throw new BikeError('Request not found');

  if (request.status === 'Terminé') {
    throw new BikeError('Cannot assign a bike to a finalized request');
  }

  const bike = await BikeInventory.findOne({ sn: input.sn.toUpperCase() });
  if (!bike) throw new BikeError(`Bike ${input.sn} not found in inventory`);

  if (bike.status !== 'Available') {
    throw new BikeError(`Bike ${input.sn} is not available (current status: ${bike.status})`);
  }

  // Attempt the assignment — the compound index will reject duplicates atomically.
  try {
    const assignment = await BikeAssignment.create({
      sn: bike.sn,
      bikeModel: bike.bikeModel,
      fifteenControlUrl: bike.fifteenControlUrl,
      requestId: request._id,
      assignedBy: new Types.ObjectId(input.actorId),
      assignedAt: new Date(),
    });

    await AuditLog.create({
      requestId: request._id,
      action: 'bike_assigned',
      byUser: new Types.ObjectId(input.actorId),
      comment: `Assigned bike ${bike.sn}`,
      metadata: { sn: bike.sn, bikeModel: bike.bikeModel },
    });

    return assignment;
  } catch (err: any) {
    if (err.code === 11000) {
      throw new BikeError(`Bike ${input.sn} is already assigned to another request`);
    }
    throw err;
  }
}

export async function unassignBikeFromRequest(input: {
  requestId: string;
  sn: string;
  actorId: string;
}) {
  if (!Types.ObjectId.isValid(input.requestId)) {
    throw new BikeError('Invalid request id');
  }

  const assignment = await BikeAssignment.findOne({
    sn: input.sn.toUpperCase(),
    requestId: new Types.ObjectId(input.requestId),
  });

  if (!assignment) {
    throw new BikeError(`Bike ${input.sn} is not assigned to this request`);
  }

  await assignment.deleteOne();

  await AuditLog.create({
    requestId: assignment.requestId,
    action: 'bike_assigned', // reusing the same action name; metadata clarifies
    byUser: new Types.ObjectId(input.actorId),
    comment: `Unassigned bike ${assignment.sn}`,
    metadata: { sn: assignment.sn, action: 'unassign' },
  });

  return { unassigned: true };
}

export async function listAssignmentsForRequest(requestId: string) {
  if (!Types.ObjectId.isValid(requestId)) return [];
  return BikeAssignment.find({ requestId: new Types.ObjectId(requestId) }).sort({ assignedAt: 1 });
}