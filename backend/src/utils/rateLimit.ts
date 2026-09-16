import { Request, Response, NextFunction } from 'express';

// All rate limiters disabled — every handler is a no-op passthrough.
export function createRateLimiter(_windowMs: number, _max: number, _message?: string) {
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export const rateLimiters: Record<string, ReturnType<typeof createRateLimiter>> = new Proxy({} as any, {
  get: (_target, _prop) => createRateLimiter(0, 0),
});
