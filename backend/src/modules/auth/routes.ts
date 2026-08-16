import { Router } from 'express';
import { login, me } from './controller';
import { requireAuth } from '../../shared/middlewares/require-auth';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, me);

export default router;