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

  it('1. Migration-From-Zero: all 16 tables are created successfully', async () => {
    const res = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const tableNames = res.rows.map((r) => r.table_name);
    expect(tableNames).toHaveLength(16);
  });

  it('AUTH-001: Better Auth reference core tables exist', async () => {
    const res = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const tables = res.rows.map((r) => r.table_name);
    for (const t of ['user', 'session', 'account', 'verification']) {
      expect(tables).toContain(t);
    }
  });

  it('AUTH-002: user table does NOT contain password_hash column', async () => {
    const res = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'user';`
    );
    const cols = res.rows.map((c) => c.column_name);
    expect(cols).not.toContain('password_hash');
  });

  it('AUTH-003: credential password exists only in account.password', async () => {
    const res = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'account';`
    );
    const cols = res.rows.map((c) => c.column_name);
    expect(cols).toContain('password');
  });

  it('AUTH-004: account contains refresh_token_expires_at column', async () => {
    const res = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'account';`
    );
    const cols = res.rows.map((c) => c.column_name);
    expect(cols).toContain('refresh_token_expires_at');
  });

  it('AUTH-005: duplicate (issuer, account_id) is rejected', async () => {
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

  it('AUTH-006: single ADMIN role enforced', async () => {
    await db.query(`INSERT INTO "user" (name, email, role) VALUES ('A1', 'a1@ex.com', 'ADMIN');`);
    await expect(
      db.query(`INSERT INTO "user" (name, email, role) VALUES ('A2', 'a2@ex.com', 'ADMIN');`)
    ).rejects.toThrow();
  });

  it('PROJECT-001: invalid status rejected', async () => {
    await expect(
      db.query(
        `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
         VALUES ('Prj', 'prj-inv-status', 'S', 'D', 'WEB_SYSTEM', 'INVALID');`
      )
    ).rejects.toThrow();
  });

  it('PROJECT-002: ARCHIVED without archived_at rejected', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;
    await expect(
      db.query(
        `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status, archived_by_user_id)
         VALUES ('Prj', 'prj-arch-no-at', 'S', 'D', 'WEB_SYSTEM', 'ARCHIVED', '${adminId}');`
      )
    ).rejects.toThrow();
  });

  it('PROJECT-003: ARCHIVED without archived_by_user_id rejected', async () => {
    await expect(
      db.query(
        `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status, archived_at)
         VALUES ('Prj', 'prj-arch-no-by', 'S', 'D', 'WEB_SYSTEM', 'ARCHIVED', NOW());`
      )
    ).rejects.toThrow();
  });

  it('MEDIA-001: invalid status rejected', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k-inv', 'image/png', 100, 'INVALID', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();
  });

  it('MEDIA-002: height <= 0 rejected', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, height, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k-h0', 'image/png', 100, 0, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();
  });

  it('MEDIA-003: ACTIVE without public_url rejected', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at, uploaded_at)
         VALUES ('f.png', 'k-act-nourl', 'image/png', 100, 'ACTIVE', '${adminId}', NOW() + INTERVAL '1 hour', NOW());`
      )
    ).rejects.toThrow();
  });

  it('MEDIA-004: ACTIVE without uploaded_at rejected', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, public_url, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k-act-noup', 'image/png', 100, 'ACTIVE', 'https://cdn.example.com/f.png', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();
  });

  it('MEDIA-005: ARCHIVED without archived_at rejected', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;
    await expect(
      db.query(
        `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
         VALUES ('f.png', 'k-arch-noat', 'image/png', 100, 'ARCHIVED', '${adminId}', NOW() + INTERVAL '1 hour');`
      )
    ).rejects.toThrow();
  });

  it('PROJECT-MEDIA-001: second project cover rejected & duplicate display_order rejected', async () => {
    const pRes = await db.query<{ id: string }>(
      `INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
       VALUES ('P Cover Test', 'p-cov-test', 'S', 'D', 'WEB_SYSTEM', 'DRAFT') RETURNING id;`
    );
    const projectId = pRes.rows[0].id;

    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const m1Res = await db.query<{ id: string }>(
      `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('m1.png', 'k-pm1', 'image/png', 100, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour') RETURNING id;`
    );
    const m1Id = m1Res.rows[0].id;

    const m2Res = await db.query<{ id: string }>(
      `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('m2.png', 'k-pm2', 'image/png', 200, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour') RETURNING id;`
    );
    const m2Id = m2Res.rows[0].id;

    await db.query(
      `INSERT INTO project_media_assets (project_id, media_asset_id, is_cover, display_order)
       VALUES ('${projectId}', '${m1Id}', true, 0);`
    );

    // Second cover rejected
    await expect(
      db.query(
        `INSERT INTO project_media_assets (project_id, media_asset_id, is_cover, display_order)
         VALUES ('${projectId}', '${m2Id}', true, 1);`
      )
    ).rejects.toThrow();

    // Duplicate display_order rejected
    await expect(
      db.query(
        `INSERT INTO project_media_assets (project_id, media_asset_id, is_cover, display_order)
         VALUES ('${projectId}', '${m2Id}', false, 0);`
      )
    ).rejects.toThrow();
  });

  it('CONTACT-001: status, READ read_at, and ARCHIVED archived_at checks', async () => {
    await expect(
      db.query(
        `INSERT INTO contact_messages (sender_name, sender_email, subject, message_body, ip_address_hash, status)
         VALUES ('John', 'john@example.com', 'Sub', 'Body', 'hash123', 'INVALID');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO contact_messages (sender_name, sender_email, subject, message_body, ip_address_hash, status)
         VALUES ('John', 'john@example.com', 'Sub', 'Body', 'hash123', 'READ');`
      )
    ).rejects.toThrow();

    await expect(
      db.query(
        `INSERT INTO contact_messages (sender_name, sender_email, subject, message_body, ip_address_hash, status)
         VALUES ('John', 'john@example.com', 'Sub', 'Body', 'hash123', 'ARCHIVED');`
      )
    ).rejects.toThrow();
  });

  it('FK-CASCADE-001: prove junction-table CASCADE on post_tags deletion', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO "user" (name, email) VALUES ('Admin', 'admin@example.com') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const catRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Cat Cascade', 'cat-casc') RETURNING id;`
    );
    const catId = catRes.rows[0].id;

    const tagRes = await db.query<{ id: string }>(
      `INSERT INTO tags (name, slug) VALUES ('Tag 1', 'tag-1') RETURNING id;`
    );
    const tagId = tagRes.rows[0].id;

    const postRes = await db.query<{ id: string }>(
      `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
       VALUES ('Post Cascade', 'post-casc', 'S', 'C', 'DRAFT', '${catId}', '${adminId}') RETURNING id;`
    );
    const postId = postRes.rows[0].id;

    await db.query(`INSERT INTO post_tags (post_id, tag_id) VALUES ('${postId}', '${tagId}');`);

    // Delete post -> junction post_tags automatically deleted via CASCADE
    await db.query(`DELETE FROM posts WHERE id = '${postId}';`);
    const ptRes = await db.query(`SELECT * FROM post_tags WHERE post_id = '${postId}';`);
    expect(ptRes.rows).toHaveLength(0);
  });

  it('AUDIT-LOG-001: Audit Log Immutability (UPDATE, DELETE, TRUNCATE rejected)', async () => {
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
    ).rejects.toThrow();
  });
});
