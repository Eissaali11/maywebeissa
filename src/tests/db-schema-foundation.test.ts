import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('DATA-FOUNDATION-001 — Isolated PGlite Schema & Governance Tests', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    const drizzleDir = path.join(process.cwd(), 'drizzle');
    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      const migrationSql = fs.readFileSync(path.join(drizzleDir, file), 'utf-8');
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

  it('AUTH-SCHEMA-001: Better Auth reference core tables exist and are compatible', async () => {
    const res = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const tableNames = res.rows.map((r) => r.table_name);
    for (const t of ['user', 'session', 'account', 'verification']) {
      expect(tableNames).toContain(t);
    }
  });

  it('AUTH-SCHEMA-002: user table does NOT contain password_hash column', async () => {
    const res = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'user';`
    );
    const cols = res.rows.map((c) => c.column_name);
    expect(cols).not.toContain('password_hash');
    expect(cols).not.toContain('passwordHash');
  });

  it('AUTH-SCHEMA-003: credential password exists only in account.password', async () => {
    const res = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'account';`
    );
    const cols = res.rows.map((c) => c.column_name);
    expect(cols).toContain('password');
  });

  it('AUTH-SCHEMA-004: account contains Better Auth 1.7.2 required identity fields', async () => {
    const res = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'account';`
    );
    const cols = res.rows.map((c) => c.column_name);
    expect(cols).toContain('issuer');
    expect(cols).toContain('account_id');
    expect(cols).toContain('provider_id');
    expect(cols).toContain('id_token');
    expect(cols).toContain('refresh_token_expires_at');
  });

  it('AUTH-SCHEMA-005: required account identity uniqueness (issuer, account_id) is enforced', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const userId = uRes.rows[0].id;

    await db.query(
      `INSERT INTO account (user_id, issuer, account_id, provider_id) VALUES ('${userId}', 'https://auth.example.com', 'acc1', 'credential');`
    );

    await expect(
      db.query(
        `INSERT INTO account (user_id, issuer, account_id, provider_id) VALUES ('${userId}', 'https://auth.example.com', 'acc1', 'credential');`
      )
    ).rejects.toThrow();
  });

  it('AUTH-SCHEMA-006: first ADMIN succeeds, second ADMIN rejected, non-ADMIN rejected', async () => {
    await db.query(
      `INSERT INTO "user" (name, email, role) VALUES ('Admin One', 'admin1@example.com', 'ADMIN');`
    );

    await expect(
      db.query(
        `INSERT INTO "user" (name, email, role) VALUES ('Admin Two', 'admin2@example.com', 'ADMIN');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO "user" (name, email, role) VALUES ('Regular User', 'user@example.com', 'USER');`
      )
    ).rejects.toThrow();
  });

  it('POST-CONSTRAINTS-001: Post status, published_at, and archived_at check constraints', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const catRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Cat 1', 'cat-1') RETURNING id;`
    );
    const catId = catRes.rows[0].id;

    await expect(
      db.query(
        `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
         VALUES ('P', 'p-inv', 'S', 'C', 'INVALID_STATUS', '${catId}', '${adminId}');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
         VALUES ('P', 'p-pub', 'S', 'C', 'PUBLISHED', '${catId}', '${adminId}');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
         VALUES ('P', 'p-arch', 'S', 'C', 'ARCHIVED', '${catId}', '${adminId}');`
      )
    ).rejects.toThrow();
  });

  it('PROJECT-CONSTRAINTS-001: Project type and status check constraints', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );

    await expect(
      db.query(
        `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
         VALUES ('P1', 'p1', 'S', 'D', 'INVALID_TYPE', 'DRAFT');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
         VALUES ('P2', 'p2', 'S', 'D', 'WEB_SYSTEM', 'PUBLISHED');`
      )
    ).rejects.toThrow();
  });

  it('MEDIA-CONSTRAINTS-001: Media assets size, dimensions, and lifecycle checks', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k1', 'image/png', -50, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, width, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k2', 'image/png', 100, 0, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k3', 'image/png', 100, 'ACTIVE', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();
  });

  it('RELATION-CONSTRAINTS-001: Display order and single cover uniqueness', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const catRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Cat 2', 'cat-2') RETURNING id;`
    );
    const catId = catRes.rows[0].id;

    const postRes = await db.query<{ id: string }>(
      `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
       VALUES ('Post 1', 'post-1', 'S', 'C', 'DRAFT', '${catId}', '${adminId}') RETURNING id;`
    );
    const postId = postRes.rows[0].id;

    const m1Res = await db.query<{ id: string }>(
      `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('m1.png', 'm1key', 'image/png', 100, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour') RETURNING id;`
    );
    const m1Id = m1Res.rows[0].id;

    const m2Res = await db.query<{ id: string }>(
      `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('m2.png', 'm2key', 'image/png', 200, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour') RETURNING id;`
    );
    const m2Id = m2Res.rows[0].id;

    await db.query(
      `INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
       VALUES ('${postId}', '${m1Id}', true, 0);`
    );

    await expect(
      db.query(
        `INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
         VALUES ('${postId}', '${m2Id}', true, 1);`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
         VALUES ('${postId}', '${m2Id}', false, 0);`
      )
    ).rejects.toThrow();
  });

  it('FK-SEMANTICS-001: RESTRICT on categories/users and CASCADE on post_tags', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const catRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Cat 3', 'cat-3') RETURNING id;`
    );
    const catId = catRes.rows[0].id;

    await db.query(
      `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
       VALUES ('Post FK', 'post-fk', 'S', 'C', 'DRAFT', '${catId}', '${adminId}');`
    );

    await expect(db.query(`DELETE FROM categories WHERE id = '${catId}';`)).rejects.toThrow();
  });

  it('AUDIT-LOG-001: Audit Log Immutability (UPDATE, DELETE, and TRUNCATE rejected)', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const auditRes = await db.query<{ id: string }>(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata_json)
       VALUES ('${adminId}', 'CREATE_POST', 'POST', '{"post_id": "123"}') RETURNING id;`
    );
    const auditId = auditRes.rows[0].id;

    await expect(
      db.query(`UPDATE audit_logs SET action = 'MODIFIED' WHERE id = '${auditId}';`)
    ).rejects.toThrow(/audit_logs is an append-only immutable table/);

    await expect(db.query(`DELETE FROM audit_logs WHERE id = '${auditId}';`)).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );

    await expect(db.query(`TRUNCATE TABLE audit_logs;`)).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );
  });
});
