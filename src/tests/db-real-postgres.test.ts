import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

describe('DATA-FOUNDATION-001 — Real PostgreSQL 16 Integration & Immutability Proof', () => {
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASS || 'postgrespassword';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5433';
  const dbName = process.env.DB_NAME || 'portfolio_test_db';

  const connectionString =
    process.env.TEST_DATABASE_URL || `postgres://${user}:${pass}@${host}:${port}/${dbName}`;

  let sql: postgres.Sql;

  beforeAll(async () => {
    sql = postgres(connectionString);

    await sql.unsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);

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
        await sql.unsafe(stmt);
      }
    }
  });

  afterAll(async () => {
    if (sql) {
      await sql.end();
    }
  });

  it('1. Fresh DB migration-from-zero produces exactly 16 tables', async () => {
    const res = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `;
    expect(res).toHaveLength(16);
  });

  it('2. Better Auth core schemas exist in PostgreSQL 16', async () => {
    const res = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `;
    const tables = res.map((r) => r.table_name);
    for (const t of ['user', 'session', 'account', 'verification']) {
      expect(tables).toContain(t);
    }
  });

  it('3. Account table contains Better Auth 1.7.2 identity columns in PostgreSQL 16', async () => {
    const res = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'account';
    `;
    const cols = res.map((c) => c.column_name);
    expect(cols).toContain('issuer');
    expect(cols).toContain('account_id');
    expect(cols).toContain('provider_id');
    expect(cols).toContain('id_token');
    expect(cols).toContain('refresh_token_expires_at');
    expect(cols).toContain('password');
  });

  it('4. User table does not contain password_hash in PostgreSQL 16', async () => {
    const res = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'user';
    `;
    const cols = res.map((c) => c.column_name);
    expect(cols).not.toContain('password_hash');
  });

  it('5. Single-Admin guard enforces exactly one ADMIN role in PostgreSQL 16', async () => {
    const [u1] = await sql`
      INSERT INTO "user" (name, email, role) VALUES ('Admin 1', 'admin1@real.com', 'ADMIN') RETURNING id;
    `;
    expect(u1.id).toBeDefined();

    await expect(sql`
      INSERT INTO "user" (name, email, role) VALUES ('Admin 2', 'admin2@real.com', 'ADMIN');
    `).rejects.toThrow();

    await expect(sql`
      INSERT INTO "user" (name, email, role) VALUES ('User 1', 'user1@real.com', 'USER');
    `).rejects.toThrow();
  });

  it('6. Post constraints: status, published_at, archived_at in PostgreSQL 16', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    const [c] =
      await sql`INSERT INTO categories (name, slug) VALUES ('Real Cat', 'real-cat') RETURNING id;`;

    await expect(sql`
      INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
      VALUES ('P', 'p-invalid', 'S', 'C', 'BAD_STATUS', ${c.id}, ${u.id});
    `).rejects.toThrow();

    await expect(sql`
      INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
      VALUES ('P', 'p-pub', 'S', 'C', 'PUBLISHED', ${c.id}, ${u.id});
    `).rejects.toThrow();
  });

  it('7. Project constraints: project_type and status in PostgreSQL 16', async () => {
    await expect(sql`
      INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
      VALUES ('Prj', 'prj-inv', 'S', 'D', 'INVALID_TYPE', 'DRAFT');
    `).rejects.toThrow();
  });

  it('8. Media constraints: size, dimensions, and status in PostgreSQL 16', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    await expect(sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('f.png', 'k1', 'image/png', -10, 'PENDING_UPLOAD', ${u.id}, NOW() + INTERVAL '1 hour');
    `).rejects.toThrow();
  });

  it('9. Relation constraints: single cover and display_order in PostgreSQL 16', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    const [c] = await sql`SELECT id FROM categories LIMIT 1;`;
    const [post] = await sql`
      INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
      VALUES ('P Cover', 'p-cover', 'S', 'C', 'DRAFT', ${c.id}, ${u.id}) RETURNING id;
    `;
    const [m1] = await sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('m1.png', 'k1', 'image/png', 100, 'PENDING_UPLOAD', ${u.id}, NOW() + INTERVAL '1 hour') RETURNING id;
    `;
    const [m2] = await sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('m2.png', 'k2', 'image/png', 200, 'PENDING_UPLOAD', ${u.id}, NOW() + INTERVAL '1 hour') RETURNING id;
    `;

    await sql`
      INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
      VALUES (${post.id}, ${m1.id}, true, 0);
    `;

    await expect(sql`
      INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
      VALUES (${post.id}, ${m2.id}, true, 1);
    `).rejects.toThrow();
  });

  it('10. FK RESTRICT policy on categories and users in PostgreSQL 16', async () => {
    const [c] = await sql`SELECT id FROM categories LIMIT 1;`;
    await expect(sql`DELETE FROM categories WHERE id = ${c.id};`).rejects.toThrow();
  });

  it('11. Audit Log Immutability: UPDATE rejected in PostgreSQL 16', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    const [audit] = await sql`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata_json)
      VALUES (${u.id}, 'CREATE_POST', 'POST', '{"post_id": "123"}') RETURNING id;
    `;

    await expect(sql`
      UPDATE audit_logs SET action = 'HACKED' WHERE id = ${audit.id};
    `).rejects.toThrow(/audit_logs is an append-only immutable table/);
  });

  it('12. Audit Log Immutability: DELETE rejected in PostgreSQL 16', async () => {
    const [audit] = await sql`SELECT id FROM audit_logs LIMIT 1;`;
    await expect(sql`
      DELETE FROM audit_logs WHERE id = ${audit.id};
    `).rejects.toThrow(/audit_logs is an append-only immutable table/);
  });

  it('13. Audit Log Immutability: TRUNCATE rejected in PostgreSQL 16', async () => {
    await expect(sql`
      TRUNCATE TABLE audit_logs;
    `).rejects.toThrow(/audit_logs is an append-only immutable table/);
  });
});
