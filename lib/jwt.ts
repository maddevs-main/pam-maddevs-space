import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

export function signToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as any;
  } catch (err) {
    return null;
  }
}

export default { signToken, verifyToken };
