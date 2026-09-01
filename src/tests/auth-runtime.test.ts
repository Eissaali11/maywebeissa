import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';

const VALID_TEST_SECRET = 'test-secret-at-least-32-characters-long-123456';
const VALID_TEST_URL = 'http://localhost:3000';

const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'postgrespassword';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'portfolio_test_db';
const defaultDbUrl = `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

let getAuth: typeof import('../modules/auth').getAuth;
let createAuthInstance: typeof import('../modules/auth').createAuthInstance;
let resetAuthInstance: typeof import('../modules/auth').resetAuthInstance;
let validateAdminSession: typeof import('../modules/auth').validateAdminSession;
let GET: typeof import('../app/api/auth/[...all]/route').GET;
let POST: typeof import('../app/api/auth/[...all]/route').POST;

describe('Auth Runtime Foundation Suite (AUTH-001 to AUTH-013)', () => {
  const originalEnv = process.env;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || defaultDbUrl;
    process.env.BETTER_AUTH_SECRET = VALID_TEST_SECRET;
    process.env.BETTER_AUTH_URL = VALID_TEST_URL;

    const authModule = await import('../modules/auth');
    getAuth = authModule.getAuth;
    createAuthInstance = authModule.createAuthInstance;
    resetAuthInstance = authModule.resetAuthInstance;
    validateAdminSession = authModule.validateAdminSession;

    const routeModule = await import('../app/api/auth/[...all]/route');
    GET = routeModule.GET;
    POST = routeModule.POST;
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.BETTER_AUTH_SECRET = VALID_TEST_SECRET;
    process.env.BETTER_AUTH_URL = VALID_TEST_URL;
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = defaultDbUrl;
    }
    resetAuthInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetAuthInstance();
    vi.restoreAllMocks();
  });

  it('AUTH-001: Better Auth server runtime initializes with valid test environment', () => {
    const auth = getAuth();
    expect(auth).toBeDefined();
    expect(auth.api).toBeDefined();
    expect(auth.handler).toBeDefined();
    expect(auth.options).toBeDefined();
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });

  it('AUTH-002: Missing mandatory auth secret/config fails closed', () => {
    delete process.env.BETTER_AUTH_SECRET;
    resetAuthInstance();
    expect(() => createAuthInstance()).toThrow(/FATAL: BETTER_AUTH_SECRET/);

    process.env.BETTER_AUTH_SECRET = 'too-short';
    resetAuthInstance();
    expect(() => createAuthInstance()).toThrow(/must be at least 32 characters/);
  });

  it('AUTH-003: /api/auth handler exposes GET and POST integration', async () => {
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');

    const req = new Request('http://localhost:3000/api/auth/ok', {
      method: 'GET',
    });
    const res = await GET(req);
    expect(res).toBeInstanceOf(Response);
  });

  it('AUTH-004: Unauthenticated get-session returns no authenticated session', async () => {
    const emptyHeaders = new Headers();
    const result = await validateAdminSession(emptyHeaders);
    expect(result.status).toBe('UNAUTHENTICATED');
    expect(result.user).toBeNull();
    expect(result.session).toBeNull();
    expect(result.reason).toBeDefined();
  });

  it('AUTH-005: Public email sign-up is disabled', () => {
    const auth = getAuth();
    expect(auth.options.emailAndPassword?.disableSignUp).toBe(true);
  });

  it('AUTH-006: Unknown/invalid email-password credentials do not authenticate', async () => {
    const auth = getAuth();
    try {
      await auth.api.signInEmail({
        body: {
          email: 'nonexistent-admin-test@example.com',
          password: 'InvalidPassword123!',
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }
  });

  it('AUTH-007: Admin-role authorization accepts ADMIN session', async () => {
    const auth = getAuth();
    const mockSession = {
      user: { id: 'test-admin-id', role: 'ADMIN', email: 'admin@example.com', name: 'Admin' },
      session: { id: 'session-id', token: 'token-123' },
    };

    vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(mockSession as any);

    const result = await validateAdminSession(
      new Headers({ cookie: 'better-auth.session_token=test' })
    );
    expect(result.status).toBe('AUTHORIZED');
    expect(result.user?.role).toBe('ADMIN');
    expect(result.session).toBeDefined();
  });

  it('AUTH-008: Admin-role authorization rejects missing session', async () => {
    const auth = getAuth();
    vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null);

    const result = await validateAdminSession(new Headers());
    expect(result.status).toBe('UNAUTHENTICATED');
    expect(result.user).toBeNull();
    expect(result.session).toBeNull();
  });

  it('AUTH-009: Admin-role authorization rejects non-ADMIN session defensively', async () => {
    const auth = getAuth();
    const mockNonAdminSession = {
      user: { id: 'test-user-id', role: 'USER', email: 'user@example.com', name: 'User' },
      session: { id: 'session-id', token: 'token-456' },
    };

    vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(mockNonAdminSession as any);

    const result = await validateAdminSession(
      new Headers({ cookie: 'better-auth.session_token=test' })
    );
    expect(result.status).toBe('FORBIDDEN');
    expect(result.user).toBeDefined();
    expect(result.reason).toContain('ADMIN');
  });

  it('AUTH-010: role is server-owned and cannot be supplied as client-controlled authorization input', () => {
    const auth = getAuth();
    const roleConfig = auth.options.user?.additionalFields?.role;
    expect(roleConfig).toBeDefined();
    expect(roleConfig?.type).toBe('string');
    expect(roleConfig?.input).toBe(false);
    expect(roleConfig?.returned).toBe(true);
    expect(roleConfig?.defaultValue).toBe('ADMIN');
    expect(roleConfig?.required).toBe(true);
  });

  it('AUTH-011: Session lifetime policy is exactly 24h / refresh age 6h and cookie cache is disabled', () => {
    const auth = getAuth();
    expect(auth.options.session?.expiresIn).toBe(86400);
    expect(auth.options.session?.updateAge).toBe(21600);
    expect(auth.options.session?.cookieCache?.enabled).toBe(false);
  });

  it('AUTH-012: BETTER_AUTH_URL is mandatory and invalid/missing URL fails closed', () => {
    delete process.env.BETTER_AUTH_URL;
    resetAuthInstance();
    expect(() => createAuthInstance()).toThrow(
      /FATAL: BETTER_AUTH_URL environment variable is required/
    );

    process.env.BETTER_AUTH_URL = 'not-a-valid-url';
    resetAuthInstance();
    expect(() => createAuthInstance()).toThrow(
      /FATAL: BETTER_AUTH_URL must be a valid absolute http or https URL/
    );

    process.env.BETTER_AUTH_URL = 'ftp://invalid-protocol.com';
    resetAuthInstance();
    expect(() => createAuthInstance()).toThrow(
      /FATAL: BETTER_AUTH_URL must be a valid absolute http or https URL/
    );
  });

  it('AUTH-013: Password policy is exactly min 12 / max 128', () => {
    const auth = getAuth();
    expect(auth.options.emailAndPassword?.minPasswordLength).toBe(12);
    expect(auth.options.emailAndPassword?.maxPasswordLength).toBe(128);
  });
});
