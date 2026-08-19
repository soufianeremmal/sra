import { Router } from 'express';
import { create, list } from './controller';
import { requireAuth } from '../../shared/middlewares/require-auth';

const router = Router();

router.post('/', requireAuth, create);
router.get('/', requireAuth, list);

export default router;