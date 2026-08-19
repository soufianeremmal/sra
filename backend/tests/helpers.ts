import supertest from 'supertest';
import { buildApp } from '../src/index';
import { createUser } from '../src/modules/auth/service';

export const app = buildApp();
export const api = supertest(app);

/**
 * Creates a seeded Marketing user and returns { user, token }.
 * Use this at the top of tests that need an authenticated Marketing session.
 */
export async function seedMarketingUser() {
  const user = await createUser({
    email: 'marketing-test@fifteen.eu',
    password: 'marketing-test-pw',
    role: 'marketing',
    name: 'Marketing Test User',
  });

  const res = await api.post('/api/auth/login').send({
    email: 'marketing-test@fifteen.eu',
    password: 'marketing-test-pw',
  });

  return { user, token: res.body.token as string };
}

/**
 * Creates a seeded Sampling user and returns { user, token }.
 */
export async function seedSamplingUser() {
  const user = await createUser({
    email: 'sampling-test@fifteen.eu',
    password: 'sampling-test-pw',
    role: 'sampling_admin',
    name: 'Sampling Test User',
  });

  const res = await api.post('/api/auth/login').send({
    email: 'sampling-test@fifteen.eu',
    password: 'sampling-test-pw',
  });

  return { user, token: res.body.token as string };
}

/**
 * Convenience: returns the Authorization header value.
 */
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}