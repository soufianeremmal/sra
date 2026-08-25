import { apiRequest } from './api';

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

export interface SamplingRequest {
  _id: string;
  projectName: string;
  city: string;
  projectType: RequestType;
  status: RequestStatus;
  requester: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | string;
  logistics?: {
    deliverByRequester?: boolean;
    companyName?: string;
    deliveryContactName?: string;
    deliveryContactPhone?: string;
    deliveryAddress?: string;
    deliveryLatestDate?: string;
    deliveryTimeSlot?: string;
    returnDate?: string;
    returnTimeSlot?: string;
  };
  bikes?: Array<{
    bikeType: 'Fusion 1' | 'Fusion 1.5' | 'Fusion 2';
    stickersType: 'Standard' | 'Custom' | 'None';
    luggageRack: boolean;
    heavyLock: boolean;
    lockTo: 'Frame' | 'Front wheel' | 'Both';
  }>;
  station?: {
    stationNeeded: boolean;
    equipment?: Array<{
      type: 'e-Dock' | 'Maintenance dock' | 'Totem' | 'Weight plate' | 'Guiding band' | 'Stickers';
      quantity: number;
      needsCharging?: boolean;
    }>;
  };
  accessories?: {
    phone?: number;
    batteryCharger?: number;
    additionalBattery?: number;
    rfidCard?: number;
    marketingMaterial?: Array<{ item: string; quantity: number }>;
  };
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDraftInput {
  projectName: string;
  city: string;
  projectType: RequestType;
}

export function listRequests(token: string) {
  return apiRequest<SamplingRequest[]>('/api/requests', { token });
}

export function getRequest(id: string, token: string) {
  return apiRequest<SamplingRequest>(`/api/requests/${id}`, { token });
}

export function createDraft(input: CreateDraftInput, token: string) {
  return apiRequest<SamplingRequest>('/api/requests', {
    method: 'POST',
    body: input,
    token,
  });
}

export interface UpdateRequestInput {
  projectName?: string;
  city?: string;
  projectType?: RequestType;
  logistics?: {
    deliverByRequester?: boolean;
    companyName?: string;
    deliveryContactName?: string;
    deliveryContactPhone?: string;
    deliveryAddress?: string;
    deliveryLatestDate?: string;
    deliveryTimeSlot?: string;
    returnDate?: string;
    returnTimeSlot?: string;
  };
  bikes?: Array<{
    bikeType: 'Fusion 1' | 'Fusion 1.5' | 'Fusion 2';
    stickersType: 'Standard' | 'Custom' | 'None';
    luggageRack: boolean;
    heavyLock: boolean;
    lockTo: 'Frame' | 'Front wheel' | 'Both';
  }>;
  station?: {
    stationNeeded: boolean;
    equipment?: Array<{
      type: 'e-Dock' | 'Maintenance dock' | 'Totem' | 'Weight plate' | 'Guiding band' | 'Stickers';
      quantity: number;
      needsCharging?: boolean;
    }>;
  };
  accessories?: {
    phone?: number;
    batteryCharger?: number;
    additionalBattery?: number;
    rfidCard?: number;
    marketingMaterial?: Array<{ item: string; quantity: number }>;
  };
  comment?: string;
}

export function updateRequest(id: string, input: UpdateRequestInput, token: string) {
  return apiRequest<SamplingRequest>(`/api/requests/${id}`, {
    method: 'PATCH',
    body: input,
    token,
  });
}

export function submitRequest(id: string, comment: string, token: string) {
  return apiRequest<SamplingRequest>(`/api/requests/${id}/submit`, {
    method: 'PATCH',
    body: { comment },
    token,
  });
}

export function deleteRequest(id: string, token: string) {
  return apiRequest<{ deleted: boolean }>(`/api/requests/${id}`, {
    method: 'DELETE',
    token,
  });
}
export interface BikeAvailabilityGroup {
  status: 'Available' | 'In repair' | 'On demo' | 'On AO' | 'On salon';
  count: number;
  bikes: Array<{ sn: string; bikeModel: string }>;
}

export function getBikeAvailability(token: string) {
  return apiRequest<BikeAvailabilityGroup[]>('/api/bikes/availability', { token });
}
export interface AuditLogEntry {
  _id: string;
  requestId: string;
  action: 'created' | 'submitted' | 'status_changed' | 'field_updated' | 'bike_assigned' | 'deleted';
  byUser: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | string;
  comment: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export function changeStatus(id: string, newStatus: RequestStatus, comment: string, token: string) {
  return apiRequest<SamplingRequest>(`/api/requests/${id}/status`, {
    method: 'PATCH',
    body: { newStatus, comment },
    token,
  });
}

export function generateEmail(id: string, token: string) {
  return apiRequest<GeneratedEmail>(`/api/requests/${id}/generate-email`, { token });
}

export interface BikeAssignment {
  _id: string;
  sn: string;
  bikeModel: string;
  fifteenControlUrl?: string;
  requestId: string;
  assignedBy: string;
  assignedAt: string;
}

export function listBikesForRequest(requestId: string, token: string) {
  return apiRequest<BikeAssignment[]>(`/api/requests/${requestId}/bikes`, { token });
}

export function assignBikeToRequest(requestId: string, sn: string, token: string) {
  return apiRequest<BikeAssignment>(`/api/requests/${requestId}/bikes`, {
    method: 'POST',
    body: { sn },
    token,
  });
}

export function unassignBike(requestId: string, sn: string, token: string) {
  return apiRequest<{ unassigned: boolean }>(`/api/requests/${requestId}/bikes/${sn}`, {
    method: 'DELETE',
    token,
  });
}

export interface ChecklistItem {
  _id: string;
  requestId: string;
  category: string;
  label: string;
  order: number;
  checked: boolean;
  checkedBy?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  checkedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export function listChecklistForRequest(requestId: string, token: string) {
  return apiRequest<ChecklistItem[]>(`/api/requests/${requestId}/checklist`, { token });
}

export function toggleChecklistItem(
  requestId: string,
  itemId: string,
  checked: boolean,
  note: string | undefined,
  token: string
) {
  const body: { checked: boolean; note?: string } = { checked };
  if (note !== undefined) body.note = note;
  return apiRequest<ChecklistItem>(
    `/api/requests/${requestId}/checklist/${itemId}`,
    { method: 'PATCH', body, token }
  );
}
export function listAuditForRequest(requestId: string, token: string) {
  return apiRequest<AuditLogEntry[]>(`/api/requests/${requestId}/audit`, { token });
}
