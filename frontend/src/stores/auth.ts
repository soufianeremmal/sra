import { defineStore } from 'pinia';
import { apiRequest } from '../services/api';

export type UserRole = 'sampling_admin' | 'marketing';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('sra_token'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isSampling: (state) => state.user?.role === 'sampling_admin',
    isMarketing: (state) => state.user?.role === 'marketing',
  },

  actions: {
    async login(email: string, password: string) {
      const res = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      this.token = res.token;
      this.user = res.user;
      localStorage.setItem('sra_token', res.token);
    },

    async fetchCurrentUser() {
        if (!this.token) return;

        try {
            const res = await apiRequest<{ user: User }>('/api/auth/me', {
            token: this.token,
            });
            this.user = res.user;
        } catch {
            // Token invalid or expired — clear everything
            this.logout();
        }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('sra_token');
    },
  },
});