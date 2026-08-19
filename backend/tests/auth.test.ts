import { describe, it, expect } from 'vitest';
import { api, seedMarketingUser, authHeader } from './helpers';

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and returns a JWT + user', async () => {
    await seedMarketingUser();

    const res = await api.post('/api/auth/login').send({
      email: 'marketing-test@fifteen.eu',
      password: 'marketing-test-pw',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('marketing-test@fifteen.eu');
    expect(res.body.user.role).toBe('marketing');
    // Critical: never return the password hash
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects wrong password with 401', async () => {
    await seedMarketingUser();

    const res = await api.post('/api/auth/login').send({
      email: 'marketing-test@fifteen.eu',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects non-existent user with same 401 (no user enumeration)', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'nobody@fifteen.eu',
      password: 'anything',
    });

    expect(res.status).toBe(401);
    // Same error message as wrong password — critical for security
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects malformed input with 400', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'x',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const { token } = await seedMarketingUser();

    const res = await api.get('/api/auth/me').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('marketing');
  });

  it('rejects request with no Authorization header (401)', async () => {
    const res = await api.get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('rejects request with invalid token (401)', async () => {
    const res = await api.get('/api/auth/me').set(authHeader('garbage-token'));

    expect(res.status).toBe(401);
  });
});