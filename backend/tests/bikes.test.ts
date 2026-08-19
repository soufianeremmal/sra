import { describe, it, expect } from 'vitest';
import { api, seedMarketingUser, seedSamplingUser, authHeader } from './helpers';

async function syncAndCreate() {
  const marketing = await seedMarketingUser();
  const sampling = await seedSamplingUser();
  await api.post('/api/bikes/sync').set(authHeader(sampling.token));
  const draftRes = await api
    .post('/api/requests')
    .set(authHeader(marketing.token))
    .send({ projectName: 'Bikes', city: 'Paris', projectType: 'AO' });
  return { marketing, sampling, draft: draftRes.body };
}

describe('POST /api/bikes/sync', () => {
  it('populates inventory from Notion stub (12 bikes)', async () => {
    const { token } = await seedSamplingUser();

    const res = await api.post('/api/bikes/sync').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.syncedCount).toBe(12);
  });
});

describe('GET /api/bikes/availability', () => {
  it('returns bikes grouped by status', async () => {
    const { token } = await seedSamplingUser();
    await api.post('/api/bikes/sync').set(authHeader(token));

    const res = await api.get('/api/bikes/availability').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const available = res.body.find((g: { status: string }) => g.status === 'Available');
    expect(available.count).toBeGreaterThan(0);
  });
});

describe('POST /api/requests/:id/bikes (assign)', () => {
  it('Sampling can assign an available bike', async () => {
    const { sampling, draft } = await syncAndCreate();

    const res = await api
      .post(`/api/requests/${draft._id}/bikes`)
      .set(authHeader(sampling.token))
      .send({ sn: '118039' });

    expect(res.status).toBe(201);
    expect(res.body.sn).toBe('118039');
    expect(res.body.bikeModel).toBe('Fusion 2');
  });

  it('Marketing cannot assign bikes (403)', async () => {
    const { marketing, draft } = await syncAndCreate();

    const res = await api
      .post(`/api/requests/${draft._id}/bikes`)
      .set(authHeader(marketing.token))
      .send({ sn: '118039' });

    expect(res.status).toBe(403);
  });

  it('refuses double-assignment', async () => {
    const { sampling, draft, marketing } = await syncAndCreate();
    const secondDraft = await api
      .post('/api/requests')
      .set(authHeader(marketing.token))
      .send({ projectName: 'Second', city: 'Paris', projectType: 'Sample' });

    await api.post(`/api/requests/${draft._id}/bikes`).set(authHeader(sampling.token)).send({ sn: '118039' });

    const res = await api
      .post(`/api/requests/${secondDraft.body._id}/bikes`)
      .set(authHeader(sampling.token))
      .send({ sn: '118039' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already assigned');
  });

  it('refuses to assign an unavailable bike (e.g. status: On AO)', async () => {
    const { sampling, draft } = await syncAndCreate();

    const res = await api
      .post(`/api/requests/${draft._id}/bikes`)
      .set(authHeader(sampling.token))
      .send({ sn: '118472' }); // "On AO" in the stub

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not available');
  });
});

describe('DELETE /api/requests/:id/bikes/:sn (unassign)', () => {
  it('Sampling can unassign', async () => {
    const { sampling, draft } = await syncAndCreate();
    await api.post(`/api/requests/${draft._id}/bikes`).set(authHeader(sampling.token)).send({ sn: '118039' });

    const res = await api
      .delete(`/api/requests/${draft._id}/bikes/118039`)
      .set(authHeader(sampling.token));

    expect(res.status).toBe(200);
    expect(res.body.unassigned).toBe(true);
  });
});