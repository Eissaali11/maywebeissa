import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/portfolio_db';

// For queries and application runtime
export const client = postgres(connectionString, {
  max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
