import { getAuth } from './auth-runtime';

export type AuthSessionStatus = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'AUTHORIZED';

export interface AuthSessionResult {
  status: AuthSessionStatus;
  user: Record<string, unknown> | null;
  session: Record<string, unknown> | null;
  reason?: string;
}

/**
 * Validates active session and enforces ADMIN role requirement via Better Auth server API.
 * Distinguishes:
 * - NO SESSION => UNAUTHENTICATED
 * - VALID SESSION BUT role != ADMIN => FORBIDDEN
 * - VALID SESSION + ADMIN => AUTHORIZED
 */
export async function validateAdminSession(headers: Headers): Promise<AuthSessionResult> {
  const auth = getAuth();

  const sessionData = await auth.api.getSession({
    headers,
  });

  if (!sessionData || !sessionData.session || !sessionData.user) {
    return {
      status: 'UNAUTHENTICATED',
      user: null,
      session: null,
      reason: 'No active session found.',
    };
  }

  const userRole = (sessionData.user as { role?: string }).role;

  if (userRole !== 'ADMIN') {
    return {
      status: 'FORBIDDEN',
      user: sessionData.user as Record<string, unknown>,
      session: sessionData.session as Record<string, unknown>,
      reason: 'User does not have required ADMIN role.',
    };
  }

  return {
    status: 'AUTHORIZED',
    user: sessionData.user as Record<string, unknown>,
    session: sessionData.session as Record<string, unknown>,
  };
}
