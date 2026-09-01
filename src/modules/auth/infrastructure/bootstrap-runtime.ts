import { betterAuth, BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../../../db';
import { user, session, account, verification } from '../../../db/schema';

export function createBootstrapAuthInstance() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('FATAL: BETTER_AUTH_SECRET environment variable is required.');
  }
  if (secret.length < 32) {
    throw new Error('FATAL: BETTER_AUTH_SECRET must be at least 32 characters long.');
  }

  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL) {
    throw new Error('FATAL: BETTER_AUTH_URL environment variable is required.');
  }
  try {
    const parsed = new URL(baseURL);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw new Error('FATAL: BETTER_AUTH_URL must be a valid absolute http or https URL.');
  }

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
      disableSignUp: false,
      autoSignIn: false,
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
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
  };

  return betterAuth(options);
}
