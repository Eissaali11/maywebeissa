import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('DATA-FOUNDATION-001 — Isolated PostgreSQL Schema & Governance Tests', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_clean_korvac.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.exec(stmt);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('extension "pgcrypto" is not available')) {
          continue;
        }
        throw err;
      }
    }
  });

  afterEach(async () => {
    await db.close();
  });

  it('1. Migration-From-Zero: all 16 tables (4 Better Auth + 12 Domain) are created successfully', async () => {
    const res = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const tableNames = res.rows.map((r) => r.table_name);

    const expectedTables = [
      'user',
      'session',
      'account',
      'verification',
      'categories',
      'posts',
      'post_tags',
      'tags',
      'technologies',
      'project_technologies',
      'projects',
      'media_assets',
      'post_media_assets',
      'project_media_assets',
      'contact_messages',
      'audit_logs',
    ];

    expect(tableNames).toHaveLength(16);
    for (const table of expectedTables) {
      expect(tableNames).toContain(table);
    }
  });

  it('2. Single-Admin Guard: prevents inserting a second ADMIN user', async () => {
    await db.query(
      `INSERT INTO "user" (name, email, role) VALUES ('Admin One', 'admin1@example.com', 'ADMIN');`
    );

    await expect(
      db.query(
        `INSERT INTO "user" (name, email, role) VALUES ('Admin Two', 'admin2@example.com', 'ADMIN');`
      )
    ).rejects.toThrow();
  });

  it('3. Case-Insensitive Unique Slug Indexes', async () => {
    await db.query(`INSERT INTO categories (name, slug) VALUES ('Web Dev', 'web-dev');`);

    // Re-inserting 'WEB-DEV' with upper-case must fail due to lower(slug) unique index
    await expect(
      db.query(`INSERT INTO categories (name, slug) VALUES ('Web Development', 'WEB-DEV');`)
    ).rejects.toThrow();
  });

  it('4. Project Type & Check Constraints', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    // Invalid project_type -> MUST FAIL
    await expect(
      db.query(
        `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
         VALUES ('P1', 'p1', 'S', 'D', 'INVALID_TYPE', 'DRAFT');`
      )
    ).rejects.toThrow();

    // Valid project_type
    await db.query(
      `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
       VALUES ('P1', 'p1', 'S', 'D', 'WEB_SYSTEM', 'DRAFT');`
    );
  });

  it('5. Non-Negative & Positive Check Constraints on Media', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    // Negative file_size_bytes -> MUST FAIL
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k1', 'image/png', -50, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();

    // Zero width -> MUST FAIL
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, width, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k2', 'image/png', 100, 0, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();
  });

  it('6. Audit Log Immutability: UPDATE, DELETE, and TRUNCATE are strictly forbidden', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const auditRes = await db.query<{ id: string }>(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata_json)
       VALUES ('${adminId}', 'CREATE_POST', 'POST', '{"post_id": "123"}') RETURNING id;`
    );
    const auditId = auditRes.rows[0].id;

    // 1. UPDATE -> MUST FAIL
    await expect(
      db.query(`UPDATE audit_logs SET action = 'MODIFIED' WHERE id = '${auditId}';`)
    ).rejects.toThrow(/audit_logs is an append-only immutable table/);

    // 2. DELETE -> MUST FAIL
    await expect(db.query(`DELETE FROM audit_logs WHERE id = '${auditId}';`)).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );

    // 3. TRUNCATE -> MUST FAIL
    await expect(db.query(`TRUNCATE TABLE audit_logs;`)).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );
  });
});
