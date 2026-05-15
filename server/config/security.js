import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

export const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const jwtSecret = () => requiredEnv('JWT_SECRET');

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
};

export const generateRequestId = () => crypto.randomUUID();
