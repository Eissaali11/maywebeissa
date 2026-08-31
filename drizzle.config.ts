import { defineConfig } from 'drizzle-kit';

const dbUrl =
  process.env.DATABASE_URL ||
  (process.env.DB_USER && process.env.DB_HOST && process.env.DB_NAME
    ? `postgres://${process.env.DB_USER}:${process.env.DB_PASS || ''}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`
    : undefined);

if (!dbUrl) {
  throw new Error('FATAL: DATABASE_URL environment variable is required.');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  strict: true,
  verbose: true,
});
