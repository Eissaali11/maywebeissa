import { describe, it, expect } from 'vitest';
import { verifyTestDatabaseSafety, assertTestDatabaseSafety } from './utils/db-safety-guard';

describe('DATA-FOUNDATION-001 — Destructive Database Safety Guard Tests', () => {
  it('SAFE-DB-001: approved test DB + explicit opt-in is ALLOWED', () => {
    const result = verifyTestDatabaseSafety({
      currentDatabase: 'portfolio_test_db',
      allowDestructiveOptIn: 'true',
    });
    expect(result.safe).toBe(true);
    expect(() =>
      assertTestDatabaseSafety({
        currentDatabase: 'portfolio_test_db',
        allowDestructiveOptIn: 'true',
      })
    ).not.toThrow();
  });

  it('SAFE-DB-002: approved test DB without explicit opt-in is REJECTED', () => {
    const result = verifyTestDatabaseSafety({
      currentDatabase: 'portfolio_test_db',
      allowDestructiveOptIn: 'false',
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('ALLOW_DESTRUCTIVE_DB_TESTS=true is missing or false');

    expect(() =>
      assertTestDatabaseSafety({
        currentDatabase: 'portfolio_test_db',
        allowDestructiveOptIn: 'false',
      })
    ).toThrow(
      'Destructive PostgreSQL integration test refused: ALLOW_DESTRUCTIVE_DB_TESTS=true is missing or false.'
    );
  });

  it('SAFE-DB-003: non-test database name + opt-in is REJECTED', () => {
    const result = verifyTestDatabaseSafety({
      currentDatabase: 'portfolio_staging',
      allowDestructiveOptIn: 'true',
    });
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('connected database is not an approved test database');

    expect(() =>
      assertTestDatabaseSafety({
        currentDatabase: 'portfolio_staging',
        allowDestructiveOptIn: 'true',
      })
    ).toThrow(
      'Destructive PostgreSQL integration test refused: connected database is not an approved test database.'
    );
  });

  it('SAFE-DB-004: production-like database name is REJECTED', () => {
    for (const prodDb of ['portfolio_prod', 'production', 'main_db', 'postgres']) {
      const result = verifyTestDatabaseSafety({
        currentDatabase: prodDb,
        allowDestructiveOptIn: 'true',
      });
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('connected database is not an approved test database');

      expect(() =>
        assertTestDatabaseSafety({
          currentDatabase: prodDb,
          allowDestructiveOptIn: 'true',
        })
      ).toThrow(
        'Destructive PostgreSQL integration test refused: connected database is not an approved test database.'
      );
    }
  });
});
