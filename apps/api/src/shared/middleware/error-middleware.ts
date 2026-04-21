import type { NextFunction, Request, Response } from 'express';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
}
