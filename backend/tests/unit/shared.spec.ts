import { describe, it, expect } from 'vitest';
import { RES_SUCCESS, RES_UNAUTHORIZED, requireAdmin, requireUser } from '../../src/routes/_shared';

const mkReq = (user?: any) => ({ session: { user } } as any);

describe('shared helpers', () => {
  it('RES_SUCCESS shape', () => {
    expect(RES_SUCCESS).toEqual({ hasError: false, status: 'OK' });
  });
  it('requireUser true when user present', () => {
    expect(requireUser(mkReq({ id: 1 }))).toBe(true);
  });
  it('requireUser false when missing', () => {
    expect(requireUser(mkReq())).toBe(false);
  });
  it('requireAdmin', () => {
    expect(requireAdmin(mkReq({ role: 'ADMIN' }))).toBe(true);
    expect(requireAdmin(mkReq({ role: 'USER' }))).toBe(false);
  });
});