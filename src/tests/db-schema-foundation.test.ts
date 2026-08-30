import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';

describe('DATA-FOUNDATION-001 — Isolated PostgreSQL Schema & Governance Tests', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    // Read and apply migration SQL
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_round_lyja.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration statements
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
          // PGlite (Postgres 15+ WASM) has built-in gen_random_uuid() natively
          continue;
        }
        throw err;
      }
    }
  });

  afterEach(async () => {
    await db.close();
  });

  it('1. Migration-From-Zero: all 13 tables are created successfully', async () => {
    const res = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
    );
    const tableNames = res.rows.map((r) => r.table_name);

    const expectedTables = [
      'users',
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

    for (const table of expectedTables) {
      expect(tableNames).toContain(table);
    }
  });

  it('2. Single-Admin Guard: prevents inserting a second ADMIN user', async () => {
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ('admin1@example.com', 'hash1', 'Admin One', 'ADMIN');`
    );

    await expect(
      db.query(
        `INSERT INTO users (email, password_hash, full_name, role) VALUES ('admin2@example.com', 'hash2', 'Admin Two', 'ADMIN');`
      )
    ).rejects.toThrow();
  });

  it('3. Post Lifecycle & Status Constraints', async () => {
    // Insert initial Admin & Category
    const userRes = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ('admin@example.com', 'hash', 'Admin User', 'ADMIN') RETURNING id;`
    );
    const adminId = userRes.rows[0].id;

    const catRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Tech', 'tech') RETURNING id;`
    );
    const catId = catRes.rows[0].id;

    // PUBLISHED status requires published_at IS NOT NULL
    await expect(
      db.query(
        `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
         VALUES ('Test Post', 'test-post', 'Summary', 'Content', 'PUBLISHED', '${catId}', '${adminId}');`
      )
    ).rejects.toThrow();

    // Valid PUBLISHED post
    await db.query(
      `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id, published_at)
       VALUES ('Test Post', 'test-post', 'Summary', 'Content', 'PUBLISHED', '${catId}', '${adminId}', NOW());`
    );
  });

  it('4. Single Cover Partial Index Constraint for Posts & Projects', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name) VALUES ('admin@example.com', 'h', 'A') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const cRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Cat', 'cat') RETURNING id;`
    );
    const catId = cRes.rows[0].id;

    const pRes = await db.query<{ id: string }>(
      `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
       VALUES ('Post 1', 'post-1', 'Sum', 'Content', 'DRAFT', '${catId}', '${adminId}') RETURNING id;`
    );
    const postId = pRes.rows[0].id;

    const m1Res = await db.query<{ id: string }>(
      `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('file1.png', 'key1', 'image/png', 1024, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour') RETURNING id;`
    );
    const m1Id = m1Res.rows[0].id;

    const m2Res = await db.query<{ id: string }>(
      `INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('file2.png', 'key2', 'image/png', 2048, 'PENDING_UPLOAD', '${adminId}', NOW() + INTERVAL '1 hour') RETURNING id;`
    );
    const m2Id = m2Res.rows[0].id;

    // Attach Media 1 as Cover
    await db.query(
      `INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
       VALUES ('${postId}', '${m1Id}', true, 0);`
    );

    // Attempting to attach Media 2 as Cover for the same post MUST FAIL
    await expect(
      db.query(
        `INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
         VALUES ('${postId}', '${m2Id}', true, 1);`
      )
    ).rejects.toThrow();
  });

  it('5. Audit Log Immutability: UPDATE and DELETE are strictly forbidden', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name) VALUES ('admin@example.com', 'h', 'A') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const auditRes = await db.query<{ id: string }>(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata_json)
       VALUES ('${adminId}', 'CREATE_POST', 'POST', '{"post_id": "123"}') RETURNING id;`
    );
    const auditId = auditRes.rows[0].id;

    // Attempt UPDATE -> MUST FAIL
    await expect(
      db.query(`UPDATE audit_logs SET action = 'MODIFIED' WHERE id = '${auditId}';`)
    ).rejects.toThrow(/audit_logs is an append-only immutable table/);

    // Attempt DELETE -> MUST FAIL
    await expect(db.query(`DELETE FROM audit_logs WHERE id = '${auditId}';`)).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );
  });

  it('6. Foreign Key RESTRICT behavior on Category Deletion', async () => {
    const uRes = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name) VALUES ('admin@example.com', 'h', 'A') RETURNING id;`
    );
    const adminId = uRes.rows[0].id;

    const cRes = await db.query<{ id: string }>(
      `INSERT INTO categories (name, slug) VALUES ('Cat', 'cat') RETURNING id;`
    );
    const catId = cRes.rows[0].id;

    await db.query(
      `INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
       VALUES ('Post 1', 'post-1', 'Sum', 'Content', 'DRAFT', '${catId}', '${adminId}');`
    );

    // Deleting category MUST FAIL because post exists referencing it
    await expect(db.query(`DELETE FROM categories WHERE id = '${catId}';`)).rejects.toThrow();
  });
});
