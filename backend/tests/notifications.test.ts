import { describe, it, expect } from 'vitest';
import { api, seedMarketingUser, authHeader } from './helpers';

describe('GET /api/requests/:id/generate-email', () => {
  it('returns pre-filled subject and body', async () => {
    const { token } = await seedMarketingUser();
    const draft = await api.post('/api/requests').set(authHeader(token)).send({
      projectName: 'Bologna',
      city: 'Bologna',
      projectType: 'AO',
    });

    const res = await api.get(`/api/requests/${draft.body._id}/generate-email`).set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.subject).toContain('Bologna');
    expect(res.body.body).toContain('Bologna');
    expect(res.body.body).toContain('AO');
  });
});

describe('Notifications on submission (fire-and-forget)', () => {
  it('submit returns 200 immediately, notifications kick off in background', async () => {
    const { token } = await seedMarketingUser();
    const draft = await api.post('/api/requests').set(authHeader(token)).send({
      projectName: 'Test',
      city: 'Paris',
      projectType: 'AO',
    });

    const start = Date.now();
    const res = await api
      .patch(`/api/requests/${draft.body._id}/submit`)
      .set(authHeader(token))
      .send({ comment: 'ready' });
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    // Should be fast — no waiting for Slack/Gmail/Notion stubs
    expect(duration).toBeLessThan(500);
  });
});