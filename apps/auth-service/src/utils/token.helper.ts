import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { setCookie } from './cookies/setCookie';

export const generateAndSetTokens = (
  res: Response,
  userId: string,
  role: string,
) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' } as any,
  );

  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.REFRESH_ACCESS_TOKEN as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as any,
  );

  setCookie(res, 'refresh_token', refreshToken);
  setCookie(res, 'access_token', accessToken, 15 * 60 * 1000);

  return { accessToken, refreshToken };
};
