import { Router } from 'express';
import { create, list, getOne } from './controller';
import { requireAuth } from '../../shared/middlewares/require-auth';

const router = Router();

router.post('/', requireAuth, create);
router.get('/', requireAuth, list);
router.get('/:id', requireAuth, getOne);

export default router;