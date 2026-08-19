import { describe, it, expect } from 'vitest';
import { api, seedMarketingUser, seedSamplingUser, authHeader } from './helpers';

describe('POST /api/feedback', () => {
  it('accepts standalone feedback', async () => {
    const { token } = await seedMarketingUser();

    const res = await api.post('/api/feedback').set(authHeader(token)).send({
      category: 'Suggestion',
      text: 'nice tool',
    });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Suggestion');
  });

  it('rejects invalid category (400)', async () => {
    const { token } = await seedMarketingUser();

    const res = await api.post('/api/feedback').set(authHeader(token)).send({
      category: 'Random',
      text: 'x',
    });

    expect(res.status).toBe(400);
  });

  it('rejects empty text (400)', async () => {
    const { token } = await seedMarketingUser();

    const res = await api.post('/api/feedback').set(authHeader(token)).send({
      category: 'Bug',
      text: '',
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/feedback (role-based visibility)', () => {
  it('Marketing sees only their own', async () => {
    const marketing = await seedMarketingUser();
    const sampling = await seedSamplingUser();

    await api.post('/api/feedback').set(authHeader(marketing.token)).send({ category: 'Bug', text: 'my bug' });
    await api.post('/api/feedback').set(authHeader(sampling.token)).send({ category: 'Bug', text: 'sampling bug' });

    const res = await api.get('/api/feedback').set(authHeader(marketing.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe('my bug');
  });

  it('Sampling sees all', async () => {
    const marketing = await seedMarketingUser();
    const sampling = await seedSamplingUser();

    await api.post('/api/feedback').set(authHeader(marketing.token)).send({ category: 'Bug', text: 'marketing' });
    await api.post('/api/feedback').set(authHeader(sampling.token)).send({ category: 'Bug', text: 'sampling' });

    const res = await api.get('/api/feedback').set(authHeader(sampling.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});