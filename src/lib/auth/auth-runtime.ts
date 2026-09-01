import { betterAuth, BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../db';
import { user, session, account, verification } from '../../db/schema';

export function createAuthInstance() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('FATAL: BETTER_AUTH_SECRET environment variable is required.');
  }
  if (secret.length < 32) {
    throw new Error('FATAL: BETTER_AUTH_SECRET must be at least 32 characters long.');
  }

  const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  const options: BetterAuthOptions = {
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user,
        session,
        account,
        verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          input: false,
          returned: true,
          required: true,
          defaultValue: 'ADMIN',
        },
      },
    },
    session: {
      expiresIn: 86400,
      updateAge: 21600,
    },
  };

  return betterAuth(options);
}

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuthInstance();
  }
  return authInstance;
}

export function resetAuthInstance() {
  authInstance = null;
}
