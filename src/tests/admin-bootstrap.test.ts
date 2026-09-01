const TEST_SECRET = 'test-secret-at-least-32-characters-long-bootstrap-suite';
const TEST_URL = 'http://localhost:3000';

const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASS || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'portfolio_test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || `postgres://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { user, session, account, verification } from '../db/schema';
import { getAuth, resetAuthInstance, validateAdminSession } from '../modules/auth';
import { bootstrapAdmin } from '../modules/auth/infrastructure/admin-bootstrap-composition';
import { assertTestDatabaseSafety } from './utils/db-safety-guard';

async function resetDbTables() {
  await db.execute(sql`ALTER TABLE audit_logs DISABLE TRIGGER ALL;`);
  await db.execute(
    sql`TRUNCATE TABLE "session", "account", "verification", "posts", "user", "audit_logs" CASCADE;`
  );
  await db.execute(sql`ALTER TABLE audit_logs ENABLE TRIGGER ALL;`);
}

describe('ADMIN-BOOTSTRAP-001 — Single Admin Bootstrap & Real Credential/Session Proof', () => {
  const originalEnv = process.env;
  let sessionCookie = '';

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;
    process.env.BETTER_AUTH_URL = TEST_URL;
    process.env.ALLOW_DESTRUCTIVE_DB_TESTS = 'true';

    const connectedDbName = new URL(process.env.DATABASE_URL!).pathname.replace('/', '');

    assertTestDatabaseSafety({
      currentDatabase: connectedDbName,
      allowDestructiveOptIn: process.env.ALLOW_DESTRUCTIVE_DB_TESTS,
    });

    // Clean tables before starting bootstrap suite
    await resetDbTables();
    resetAuthInstance();
  });

  afterAll(async () => {
    process.env = originalEnv;
    resetAuthInstance();
  });

  it('BOOTSTRAP-001: Fresh database allows one ADMIN bootstrap', async () => {
    const admin = await bootstrapAdmin({
      name: 'Initial Admin',
      email: 'admin@example.com',
      password: 'InitialPassword123!',
    });

    expect(admin).toBeDefined();
    expect(admin.id).toBeDefined();
    expect(admin.email).toBe('admin@example.com');
    expect(admin.name).toBe('Initial Admin');
    expect(admin.role).toBe('ADMIN');
  });

  it('BOOTSTRAP-002: Bootstrap creates exactly one user with ADMIN role', async () => {
    const users = await db.select().from(user);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('admin@example.com');
    expect(users[0].role).toBe('ADMIN');
  });

  it('BOOTSTRAP-003: Bootstrap creates Better Auth credential account', async () => {
    const accounts = await db.select().from(account);
    const users = await db.select().from(user);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe('credential');
    expect(accounts[0].userId).toBe(users[0].id);
    expect(accounts[0].accountId).toBeDefined();
  });

  it('BOOTSTRAP-004: Stored password is hashed and not plaintext', async () => {
    const accounts = await db.select().from(account);
    const storedPassword = accounts[0].password;

    expect(storedPassword).toBeDefined();
    expect(storedPassword).not.toBe('InitialPassword123!');
    expect(typeof storedPassword).toBe('string');
    expect(storedPassword!.length).toBeGreaterThan(20);
  });

  it('BOOTSTRAP-005: Second bootstrap attempt is rejected', async () => {
    await expect(
      bootstrapAdmin({
        name: 'Second Admin',
        email: 'admin2@example.com',
        password: 'SecondPassword123!',
      })
    ).rejects.toThrow(/ADMIN_BOOTSTRAP_ALREADY_INITIALIZED/);

    const users = await db.select().from(user);
    expect(users).toHaveLength(1);
  });

  it('BOOTSTRAP-006: Production runtime still rejects public signup', async () => {
    const prodAuth = getAuth();
    expect(prodAuth.options.emailAndPassword?.disableSignUp).toBe(true);

    try {
      await prodAuth.api.signUpEmail({
        body: {
          name: 'Public User',
          email: 'public@example.com',
          password: 'PublicPassword123!',
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }

    const users = await db.select().from(user);
    expect(users).toHaveLength(1);
  });

  it('BOOTSTRAP-007: Correct credentials sign in successfully', async () => {
    const prodAuth = getAuth();
    const res = await prodAuth.api.signInEmail({
      body: {
        email: 'admin@example.com',
        password: 'InitialPassword123!',
      },
      asResponse: true,
    });

    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('better-auth.session_token');
    sessionCookie = setCookie!;
  });

  it('BOOTSTRAP-008: Wrong password fails authentication', async () => {
    const prodAuth = getAuth();
    try {
      await prodAuth.api.signInEmail({
        body: {
          email: 'admin@example.com',
          password: 'WrongPassword123!',
        },
      });
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }
  });

  it('BOOTSTRAP-009: Signed-in cookie resolves through auth.api.getSession', async () => {
    const prodAuth = getAuth();
    const reqHeaders = new Headers({ cookie: sessionCookie });

    const sessionData = await prodAuth.api.getSession({
      headers: reqHeaders,
    });

    expect(sessionData).toBeDefined();
    expect(sessionData?.user).toBeDefined();
    expect(sessionData?.session).toBeDefined();
    expect(sessionData?.user.email).toBe('admin@example.com');
  });

  it('BOOTSTRAP-010: validateAdminSession returns AUTHORIZED', async () => {
    const reqHeaders = new Headers({ cookie: sessionCookie });
    const result = await validateAdminSession(reqHeaders);

    expect(result.status).toBe('AUTHORIZED');
    expect(result.user).toBeDefined();
    expect(result.user?.role).toBe('ADMIN');
    expect(result.session).toBeDefined();
  });

  it('BOOTSTRAP-011: Session is persisted in database', async () => {
    const sessions = await db.select().from(session);
    expect(sessions.length).toBeGreaterThanOrEqual(1);

    const activeSession = sessions[0];
    expect(activeSession.userId).toBeDefined();

    const users = await db.select().from(user);
    expect(activeSession.userId).toBe(users[0].id);

    const now = new Date().getTime();
    const expiresAtTime = new Date(activeSession.expiresAt).getTime();
    const diffSeconds = Math.round((expiresAtTime - now) / 1000);

    // Verify expiresIn is approximately 86400 seconds (24h)
    expect(diffSeconds).toBeGreaterThan(80000);
    expect(diffSeconds).toBeLessThanOrEqual(86400);
  });

  it('BOOTSTRAP-012: Password/session/secret values are never logged by bootstrap code', async () => {
    const logSpy = vi.spyOn(console, 'log');
    const errSpy = vi.spyOn(console, 'error');
    const warnSpy = vi.spyOn(console, 'warn');

    // Clean DB to allow test bootstrap call
    await resetDbTables();

    await bootstrapAdmin({
      name: 'Clean Log Admin',
      email: 'cleanlog@example.com',
      password: 'SecretLogPassword123!',
    });

    const allCallArgs = [...logSpy.mock.calls, ...errSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .map((arg) => String(arg));

    for (const arg of allCallArgs) {
      expect(arg).not.toContain('SecretLogPassword123!');
      expect(arg).not.toContain(TEST_SECRET);
    }

    logSpy.mockRestore();
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('BOOTSTRAP-013: Concurrent bootstrap execution results in exactly 1 winner and 1 normalized rejection', async () => {
    // Clean DB before concurrent race execution
    await resetDbTables();

    const promise1 = bootstrapAdmin({
      name: 'Concurrent Admin 1',
      email: 'concurrent1@example.com',
      password: 'ConcurrentPass123!',
    });

    const promise2 = bootstrapAdmin({
      name: 'Concurrent Admin 2',
      email: 'concurrent2@example.com',
      password: 'ConcurrentPass456!',
    });

    const results = await Promise.allSettled([promise1, promise2]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedReason).toBeDefined();
    expect(String(rejectedReason)).toMatch(/ADMIN_BOOTSTRAP_ALREADY_INITIALIZED/);

    const users = await db.select().from(user);
    expect(users).toHaveLength(1);
    expect(users[0].role).toBe('ADMIN');

    const accounts = await db.select().from(account);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerId).toBe('credential');
    expect(accounts[0].userId).toBe(users[0].id);

    // Verify winner sign-in capability
    const winnerEmail = users[0].email;
    const winnerPassword =
      winnerEmail === 'concurrent1@example.com' ? 'ConcurrentPass123!' : 'ConcurrentPass456!';

    const prodAuth = getAuth();
    const signInRes = await prodAuth.api.signInEmail({
      body: {
        email: winnerEmail,
        password: winnerPassword,
      },
      asResponse: true,
    });

    expect(signInRes.status).toBe(200);
    const setCookie = signInRes.headers.get('set-cookie');
    expect(setCookie).toBeDefined();

    const winnerSession = await prodAuth.api.getSession({
      headers: new Headers({ cookie: setCookie! }),
    });

    expect(winnerSession).toBeDefined();
    expect(winnerSession?.user.email).toBe(winnerEmail);
  });
});
