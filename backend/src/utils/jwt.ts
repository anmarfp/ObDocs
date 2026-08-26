import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'docsob-fallback-secret-key-for-dev';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
