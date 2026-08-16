import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from './model';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = '7d';

export async function loginWithEmailAndPassword(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function createUser(input: {
  email: string;
  password: string;
  role: 'sampling_admin' | 'marketing';
  name: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    name: input.name,
  });
  return user;
}