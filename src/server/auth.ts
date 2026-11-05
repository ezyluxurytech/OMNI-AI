import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, User } from './db.js';

const JWT_SECRET = process.env.SESSION_SECRET || 'astraea_cosmic_jwt_secret_2026_x87a';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function createToken(userId: string): string {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${head}.${body}`)
    .digest('base64url');
  return `${head}.${body}.${sig}`;
}

export function verifyToken(token: string): string | null {
  try {
    const [head, body, sig] = token.split('.');
    if (!head || !body || !sig) return null;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${head}.${body}`)
      .digest('base64url');

    if (sig !== expectedSig) return null;

    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed.sub;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = db.getUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.user = user;
  next();
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    preferences: user.preferences,
  };
}
