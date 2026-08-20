import { Request, Response } from 'express';
import { z } from 'zod';
import { loginWithEmailAndPassword } from './service';
import { User } from './model';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
  }

  try {
    const result = await loginWithEmailAndPassword(parsed.data.email, parsed.data.password);
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}
export async function me(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  const user = await User.findById(req.user.userId).select('email name role');
  if (!user) return res.status(401).json({ error: 'User not found' });

  res.setHeader('Cache-Control', 'no-store'); 
  
  return res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}