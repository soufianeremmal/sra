import { Router } from 'express';
import {
  inventory,
  availability,
  sync,
  assign,
  unassign,
  listForRequest,
} from './controller';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';

// Routes mounted at /api/bikes
export const bikesGlobalRouter = Router();
bikesGlobalRouter.get('/inventory', requireAuth, inventory);
bikesGlobalRouter.get('/availability', requireAuth, availability);
bikesGlobalRouter.post('/sync', requireAuth, requireRole('sampling_admin'), sync);

// Routes mounted under /api/requests/:id/bikes (request-scoped)
export const bikesForRequestRouter = Router({ mergeParams: true });
bikesForRequestRouter.get('/', requireAuth, listForRequest);
bikesForRequestRouter.post('/', requireAuth, requireRole('sampling_admin'), assign);
bikesForRequestRouter.delete('/:sn', requireAuth, requireRole('sampling_admin'), unassign);