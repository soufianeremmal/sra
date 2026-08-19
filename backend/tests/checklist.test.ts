import { describe, it, expect } from 'vitest';
import { api, seedMarketingUser, seedSamplingUser, authHeader } from './helpers';
import { ChecklistItem } from '../src/modules/checklist/models/checklist-item.model';

async function setupRequestInEnCours() {
  const marketing = await seedMarketingUser();
  const sampling = await seedSamplingUser();
  const draft = await api
    .post('/api/requests')
    .set(authHeader(marketing.token))
    .send({ projectName: 'Chk', city: 'Paris', projectType: 'AO' });
  await api.patch(`/api/requests/${draft.body._id}/submit`).set(authHeader(marketing.token)).send({ comment: 'go' });
  await api
    .patch(`/api/requests/${draft.body._id}/status`)
    .set(authHeader(sampling.token))
    .send({ newStatus: 'En cours', comment: 'start' });
  return { marketing, sampling, request: draft.body };
}

describe('Checklist auto-generation on En cours', () => {
  it('creates 30 items when a request enters En cours', async () => {
    const { sampling, request } = await setupRequestInEnCours();

    const res = await api.get(`/api/requests/${request._id}/checklist`).set(authHeader(sampling.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(30);
    expect(res.body[0].checked).toBe(false);
  });
});

describe('PATCH /api/requests/:id/checklist/:itemId', () => {
  it('Sampling can tick an item', async () => {
    const { sampling, request } = await setupRequestInEnCours();
    const list = await api.get(`/api/requests/${request._id}/checklist`).set(authHeader(sampling.token));

    const res = await api
      .patch(`/api/requests/${request._id}/checklist/${list.body[0]._id}`)
      .set(authHeader(sampling.token))
      .send({ checked: true, note: 'OK' });

    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
    expect(res.body.note).toBe('OK');
    expect(res.body.checkedBy).toBeDefined();
  });

  it('Marketing cannot tick (403)', async () => {
    const { marketing, sampling, request } = await setupRequestInEnCours();
    const list = await api.get(`/api/requests/${request._id}/checklist`).set(authHeader(sampling.token));

    const res = await api
      .patch(`/api/requests/${request._id}/checklist/${list.body[0]._id}`)
      .set(authHeader(marketing.token))
      .send({ checked: true });

    expect(res.status).toBe(403);
  });
});

describe('Checklist gate on Prêt à enlever', () => {
  it('blocks the transition if checklist is incomplete', async () => {
    const { sampling, request } = await setupRequestInEnCours();
    // Walk forward: En cours → Prêt à tester → Emballé
    await api
      .patch(`/api/requests/${request._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Prêt à tester', comment: 'x' });
    await api
      .patch(`/api/requests/${request._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Emballé', comment: 'x' });

    // Try Emballé → Prêt à enlever with unchecked items
    const res = await api
      .patch(`/api/requests/${request._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Prêt à enlever', comment: 'go' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Checklist incomplete');
  });

  it('allows the transition when all items are checked', async () => {
    const { sampling, request } = await setupRequestInEnCours();
    // Check all items directly in DB (test shortcut)
    await ChecklistItem.updateMany({ requestId: request._id }, { $set: { checked: true } });

    await api
      .patch(`/api/requests/${request._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Prêt à tester', comment: 'x' });
    await api
      .patch(`/api/requests/${request._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Emballé', comment: 'x' });

    const res = await api
      .patch(`/api/requests/${request._id}/status`)
      .set(authHeader(sampling.token))
      .send({ newStatus: 'Prêt à enlever', comment: 'go' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Prêt à enlever');
  });
});