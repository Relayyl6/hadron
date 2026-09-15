import { Response } from 'express';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  maxAge: number = 7 * 24 * 60 * 60 * 1000, // Defaults to 7 days
) => {
  res.cookie(name, value, {
    httpOnly: true,
    sameSite: 'lax', // Use lax to allow cross-port requests on localhost without requiring secure: true
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAge,
  });
};
