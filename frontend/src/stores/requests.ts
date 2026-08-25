import { defineStore } from 'pinia';
import {
  listRequests as apiListRequests,
  createDraft as apiCreateDraft,
  updateRequest as apiUpdateRequest,
  submitRequest as apiSubmitRequest,
  deleteRequest as apiDeleteRequest,
  getRequest as apiGetRequest,
  changeStatus as apiChangeStatus,
} from '../services/requests';
import type {
  SamplingRequest,
  CreateDraftInput,
  UpdateRequestInput,
  RequestStatus,
} from '../services/requests';
import { useAuthStore } from './auth';

interface RequestsState {
  items: SamplingRequest[];
  loading: boolean;
  error: string | null;
}

export const useRequestsStore = defineStore('requests', {
  state: (): RequestsState => ({
    items: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll() {
      const auth = useAuthStore();
      if (!auth.token) return;

      this.loading = true;
      this.error = null;
      try {
        this.items = await apiListRequests(auth.token);
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load requests';
      } finally {
        this.loading = false;
      }
    },

    async createNewDraft(input: CreateDraftInput): Promise<SamplingRequest | null> {
      const auth = useAuthStore();
      if (!auth.token) return null;

      const doc = await apiCreateDraft(input, auth.token);
      this.items.unshift(doc); // add to top of list optimistically
      return doc;
    },

    async fetchOne(id: string): Promise<SamplingRequest | null> {
      const auth = useAuthStore();
      if (!auth.token) return null;
      return apiGetRequest(id, auth.token);
    },

    async updateFields(id: string, input: UpdateRequestInput): Promise<SamplingRequest | null> {
      const auth = useAuthStore();
      if (!auth.token) return null;

      const updated = await apiUpdateRequest(id, input, auth.token);
      // Also update it in the list, so the dashboard reflects the change
      const idx = this.items.findIndex((r) => r._id === id);
      if (idx !== -1) this.items[idx] = updated;
      return updated;
    },

    async submitDraft(id: string, comment: string): Promise<SamplingRequest | null> {
      const auth = useAuthStore();
      if (!auth.token) return null;

      const submitted = await apiSubmitRequest(id, comment, auth.token);
      const idx = this.items.findIndex((r) => r._id === id);
      if (idx !== -1) this.items[idx] = submitted;
      return submitted;
    },

    async removeRequest(id: string): Promise<boolean> {
      const auth = useAuthStore();
      if (!auth.token) return false;

      await apiDeleteRequest(id, auth.token);
      this.items = this.items.filter((r) => r._id !== id);
      return true;
    },
    async changeRequestStatus(id: string, newStatus: RequestStatus, comment: string): Promise<SamplingRequest | null> {
      const auth = useAuthStore();
      if (!auth.token) return null;

      const updated = await apiChangeStatus(id, newStatus, comment, auth.token);
      const idx = this.items.findIndex((r) => r._id === id);
      if (idx !== -1) this.items[idx] = updated;
      return updated;
    },
  },
});
