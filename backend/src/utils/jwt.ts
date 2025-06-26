import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export function signToken(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, ...options });
}

export function signRefreshToken(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN, ...options });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function decodeToken(token: string) {
  return jwt.decode(token);
}
