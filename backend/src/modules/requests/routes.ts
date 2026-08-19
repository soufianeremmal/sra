import { Router } from 'express';
import { create, list, getOne, submit, updateStatus, update, remove } from './controller';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';

const router = Router();

router.post('/', requireAuth, create);
router.get('/', requireAuth, list);
router.get('/:id', requireAuth, getOne);

// Marketing edits their own request fields (blocked when status = Terminé)
router.patch('/:id', requireAuth, update);

// Marketing submits their draft — moves Draft → À faire
router.patch('/:id/submit', requireAuth, submit);

// Sampling manages all other status transitions
router.patch('/:id/status', requireAuth, requireRole('sampling_admin'), updateStatus);

// Delete — Marketing can delete own drafts, Sampling can delete anything
router.delete('/:id', requireAuth, remove);

export default router;