import jwt from 'jsonwebtoken';

// Accept either NEXTAUTH_SECRET (used by NextAuth) or JWT_SECRET (legacy).
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

export function signToken(payload: object, expiresIn = '7d') {
  const secret = NEXTAUTH_SECRET || JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string) {
  // Try NextAuth secret first (if present), then fallback to legacy JWT secret.
  const secrets = [] as string[];
  if (NEXTAUTH_SECRET) secrets.push(NEXTAUTH_SECRET);
  secrets.push(JWT_SECRET);

  for (const s of secrets) {
    try {
      return jwt.verify(token, s) as any;
    } catch (err) {
      // try next secret
    }
  }
  return null;
}

export default { signToken, verifyToken };
