import { randomBytes } from 'node:crypto';

const configuredSecret = process.env.JWT_SECRET?.trim();
if (process.env.NODE_ENV === 'production' &&
  (!configuredSecret || configuredSecret.length < 32 || configuredSecret.includes('change_in_prod'))) {
  throw new Error('JWT_SECRET cần ít nhất 32 ký tự trong môi trường production.');
}

export const jwtSecret = configuredSecret || randomBytes(48).toString('base64url');
