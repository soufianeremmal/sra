import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../modules/auth/model';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

// Extend Express's Request type so req.user is properly typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    res.setHeader('Cache-Control', 'no-store');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}