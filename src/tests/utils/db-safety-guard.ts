export interface DbSafetyOptions {
  currentDatabase?: string;
  allowDestructiveOptIn?: string;
}

export function isApprovedTestDatabase(dbName?: string): boolean {
  if (!dbName || typeof dbName !== 'string') return false;
  const name = dbName.trim();
  if (name === 'portfolio_test_db') return true;
  if (name.endsWith('_test') || name.endsWith('_test_db')) return true;
  return false;
}

export function verifyTestDatabaseSafety(options?: DbSafetyOptions): {
  safe: boolean;
  reason?: string;
} {
  const optIn = options?.allowDestructiveOptIn ?? process.env.ALLOW_DESTRUCTIVE_DB_TESTS;
  const dbName = options?.currentDatabase;

  if (optIn !== 'true') {
    return {
      safe: false,
      reason:
        'Destructive PostgreSQL integration test refused: ALLOW_DESTRUCTIVE_DB_TESTS=true is missing or false.',
    };
  }

  if (!isApprovedTestDatabase(dbName)) {
    return {
      safe: false,
      reason:
        'Destructive PostgreSQL integration test refused: connected database is not an approved test database.',
    };
  }

  return { safe: true };
}

export function assertTestDatabaseSafety(options?: DbSafetyOptions): void {
  const check = verifyTestDatabaseSafety(options);
  if (!check.safe) {
    throw new Error(check.reason);
  }
}
