import { describe, it, expect } from 'vitest';
import { api, seedMarketingUser, seedSamplingUser, authHeader } from './helpers';

async function createDraft(token: string, projectName = 'Test project') {
  const res = await api.post('/api/requests').set(authHeader(token)).send({
    projectName,
    city: 'Paris',
    projectType: 'AO',
  });
  return res.body;
}

describe('POST /api/requests', () => {
  it('creates a draft with status "Draft" and audit entry', async () => {
    const { token } = await seedMarketingUser();

    const res = await api.post('/api/requests').set(authHeader(token)).send({
      projectName: 'Bologna',
      city: 'Bologna',
      projectType: 'AO',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Draft');
    expect(res.body.projectName).toBe('Bologna');
    expect(res.body.requester).toBeDefined();
  });

  it('rejects missing required fields with 400', async () => {
    const { token } = await seedMarketingUser();

    const res = await api.post('/api/requests').set(authHeader(token)).send({
      projectName: '',
    });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await api.post('/api/requests').send({ projectName: 'x', city: 'y', projectType: 'AO' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/requests/:id/submit', () => {
  it('moves Draft to À faire with a comment', async () => {
    const { token } = await seedMarketingUser();
    const draft = await createDraft(token);

    const res = await api
      .patch(`/api/requests/${draft._id}/submit`)
      .set(authHeader(token))
      .send({ comment: 'ready' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('À faire');
  });

  it('rejects submit without a comment', async () => {
    const { token } = await seedMarketingUser();
    const draft = await createDraft(token);

    const res = await api.patch(`/api/requests/${draft._id}/submit`).set(authHeader(token)).send({});

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/requests/:id/status', () => {
  it('only Sampling can change status (403 for Marketing)', async () => {
    const marketing = await seedMarketingUser();
    const draft = await createDraft(marketing.token);
    await api.patch(`/api/requests/${draft._id}/submit`).set(authHeader(marketing.token)).send({ comment: 'go' });

    const res = await api
      .patch(`/api/requests/${draft._id}/status`)
      .set(authHeader(marketing.token))
      .send({ newStatus: 'En cours', comment: 'trying' });

    expect(res.status).toBe(403);
  });

  it('Sampling can advance status', async () => {
    const marketing = await seedMarketingUser();
    const sampling = await seedSamplingUser();
    const draft = await createDraft(marketing.token);
    await api.patch(`/api/requests/${draft._id}/submit`).set(authHeader(marketing.token)).send({ comment: 'go' });

    const res = await api
      .patch(`/api/requests/${draft._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'En cours', comment: 'starting' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('En cours');
  });

  it('blocks illegal transitions with 400', async () => {
    const marketing = await seedMarketingUser();
    const sampling = await seedSamplingUser();
    const draft = await createDraft(marketing.token);
    await api.patch(`/api/requests/${draft._id}/submit`).set(authHeader(marketing.token)).send({ comment: 'go' });
    await api
      .patch(`/api/requests/${draft._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'En cours', comment: 'starting' });

    // Try to jump En cours → Terminé (illegal)
    const res = await api
      .patch(`/api/requests/${draft._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Terminé', comment: 'skipping' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Illegal transition');
  });
});

describe('PATCH /api/requests/:id (edit fields)', () => {
  it('Marketing can edit their draft fields', async () => {
    const { token } = await seedMarketingUser();
    const draft = await createDraft(token);

    const res = await api.patch(`/api/requests/${draft._id}`).set(authHeader(token)).send({
      projectName: 'Renamed',
    });

    expect(res.status).toBe(200);
    expect(res.body.projectName).toBe('Renamed');
  });

  it('drops forbidden fields silently (e.g. status)', async () => {
    const { token } = await seedMarketingUser();
    const draft = await createDraft(token);

    const res = await api.patch(`/api/requests/${draft._id}`).set(authHeader(token)).send({
      projectName: 'Renamed',
      status: 'Terminé',
    });

    expect(res.status).toBe(200);
    expect(res.body.projectName).toBe('Renamed');
    expect(res.body.status).toBe('Draft'); // status ignored
  });
});

describe('DELETE /api/requests/:id', () => {
  it('Marketing can delete their own draft', async () => {
    const { token } = await seedMarketingUser();
    const draft = await createDraft(token);

    const res = await api.delete(`/api/requests/${draft._id}`).set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it('Marketing cannot delete a submitted request', async () => {
    const { token } = await seedMarketingUser();
    const draft = await createDraft(token);
    await api.patch(`/api/requests/${draft._id}/submit`).set(authHeader(token)).send({ comment: 'go' });

    const res = await api.delete(`/api/requests/${draft._id}`).set(authHeader(token));

    expect(res.status).toBe(403);
  });

  it('Sampling can delete any request', async () => {
    const marketing = await seedMarketingUser();
    const sampling = await seedSamplingUser();
    const draft = await createDraft(marketing.token);
    await api.patch(`/api/requests/${draft._id}/submit`).set(authHeader(marketing.token)).send({ comment: 'go' });

    const res = await api.delete(`/api/requests/${draft._id}`).set(authHeader(sampling.token));

    expect(res.status).toBe(200);
  });
});