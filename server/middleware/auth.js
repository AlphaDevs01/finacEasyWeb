import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { jwtSecret } from '../config/security.js';

dotenv.config();

const extractToken = (req) => {
  if (req.cookies?.access_token) return req.cookies.access_token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
};

export const authenticateToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  try {
    req.user = jwt.verify(token, jwtSecret());
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, jwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};
