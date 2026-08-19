import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../modules/auth/model';

export function requireRole(...allowedRoles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient role' });
    }
    next();
  };
} 