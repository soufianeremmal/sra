import { Router } from 'express';
import { list, toggle } from './controller';
import { requireAuth } from '../../shared/middlewares/require-auth';
import { requireRole } from '../../shared/middlewares/require-role';

// Mounted under /api/requests/:id/checklist
const router = Router({ mergeParams: true });

router.get('/', requireAuth, list);
router.patch('/:itemId', requireAuth, requireRole('sampling_admin'), toggle);

export default router;