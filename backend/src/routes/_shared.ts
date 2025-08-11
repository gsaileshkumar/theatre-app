import type { FastifyRequest } from 'fastify';

export const RES_SUCCESS = { hasError: false, status: 'OK' } as const;
export const RES_UNAUTHORIZED = { hasError: true, status: 'Unauthorized' } as const;
export const RES_ERROR = { hasError: true, status: 'App Error' } as const;
export const RES_FAILURE = { hasError: true, status: 'Server error' } as const;
export const RES_VALIDATION_FAILURE = { hasError: true, status: 'Server error', message: 'Validation failure' } as const;

// Augment session data stored by @fastify/session
declare module '@fastify/session' {
  interface SessionData {
    user?: { id: number; role: 'ADMIN' | 'USER'; full_name: string } | null;
    captcha?: string | null;
  }
}

export function requireUser(request: FastifyRequest) {
  const user = (request as any).session?.user as { id: number } | undefined;
  if (!user || !user.id) {
    return false;
  }
  return true;
}

export function requireAdmin(request: FastifyRequest) {
  const user = (request as any).session?.user as { role?: string } | undefined;
  return Boolean(user && user.role === 'ADMIN');
}