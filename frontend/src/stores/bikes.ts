import { defineStore } from 'pinia';
import { getBikeAvailability } from '../services/requests';
import type { BikeAvailabilityGroup } from '../services/requests';
import { useAuthStore } from './auth';

interface BikesState {
  availability: BikeAvailabilityGroup[];
  loading: boolean;
  error: string | null;
}

export const useBikesStore = defineStore('bikes', {
  state: (): BikesState => ({
    availability: [],
    loading: false,
    error: null,
  }),

  getters: {
    // Small helpers so components stay clean
    countByStatus: (state) => (status: string): number => {
      const group = state.availability.find((g) => g.status === status);
      return group?.count || 0;
    },
    totalBikes: (state): number => {
      return state.availability.reduce((sum, g) => sum + g.count, 0);
    },
  },

  actions: {
    async fetchAvailability() {
      const auth = useAuthStore();
      if (!auth.token) return;

      this.loading = true;
      this.error = null;
      try {
        this.availability = await getBikeAvailability(auth.token);
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load bikes';
      } finally {
        this.loading = false;
      }
    },
  },
});