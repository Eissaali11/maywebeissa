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

  it('4. Duplicate (issuer, account_id) rejected on real PostgreSQL 16', async () => {
    const [u] = await sql`
      INSERT INTO "user" (name, email, role) VALUES ('Admin Dup', 'admindup@real.com', 'ADMIN') RETURNING id;
    `;
    await sql`
      INSERT INTO account (user_id, issuer, account_id, provider_id)
      VALUES (${u.id}, 'https://auth.example.com', 'acc123', 'credential');
    `;
    await expect(sql`
      INSERT INTO account (user_id, issuer, account_id, provider_id)
      VALUES (${u.id}, 'https://auth.example.com', 'acc123', 'credential');
    `).rejects.toThrow();
  });

  it('5. Project invalid status, ARCHIVED without archived_at & archived_by_user_id rejected', async () => {
    await expect(sql`
      INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
      VALUES ('P1', 'p1-inv', 'S', 'D', 'WEB_SYSTEM', 'INVALID_STATUS');
    `).rejects.toThrow();

    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;

    await expect(sql`
      INSERT INTO projects (title, slug, summary, description_markdown, project_type, status, archived_by_user_id)
      VALUES ('P2', 'p2-arch-noat', 'S', 'D', 'WEB_SYSTEM', 'ARCHIVED', ${u.id});
    `).rejects.toThrow();

    await expect(sql`
      INSERT INTO projects (title, slug, summary, description_markdown, project_type, status, archived_at)
      VALUES ('P3', 'p3-arch-noby', 'S', 'D', 'WEB_SYSTEM', 'ARCHIVED', NOW());
    `).rejects.toThrow();
  });

  it('6. Media invalid status, height <= 0, ACTIVE/public_url, ACTIVE/uploaded_at, ARCHIVED/archived_at rejected', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;

    // invalid status
    await expect(sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('f.png', 'k-inv', 'image/png', 100, 'INVALID', ${u.id}, NOW() + INTERVAL '1 hour');
    `).rejects.toThrow();

    // height <= 0
    await expect(sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, height, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('f.png', 'k-h0', 'image/png', 100, 0, 'PENDING_UPLOAD', ${u.id}, NOW() + INTERVAL '1 hour');
    `).rejects.toThrow();

    // ACTIVE without public_url
    await expect(sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at, uploaded_at)
      VALUES ('f.png', 'k-act-nourl', 'image/png', 100, 'ACTIVE', ${u.id}, NOW() + INTERVAL '1 hour', NOW());
    `).rejects.toThrow();

    // ACTIVE without uploaded_at
    await expect(sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, public_url, uploaded_by_user_id, upload_expires_at)
      VALUES ('f.png', 'k-act-noup', 'image/png', 100, 'ACTIVE', 'https://cdn.example.com/f.png', ${u.id}, NOW() + INTERVAL '1 hour');
    `).rejects.toThrow();

    // ARCHIVED without archived_at
    await expect(sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('f.png', 'k-arch-noat', 'image/png', 100, 'ARCHIVED', ${u.id}, NOW() + INTERVAL '1 hour');
    `).rejects.toThrow();
  });

  it('7. Project Media second cover and duplicate display_order rejected', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    const [p] = await sql`
      INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
      VALUES ('Prj Cover Test', 'prj-cov-test', 'S', 'D', 'WEB_SYSTEM', 'DRAFT') RETURNING id;
    `;
    const [m1] = await sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('m1.png', 'k-pm1', 'image/png', 100, 'PENDING_UPLOAD', ${u.id}, NOW() + INTERVAL '1 hour') RETURNING id;
    `;
    const [m2] = await sql`
      INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
      VALUES ('m2.png', 'k-pm2', 'image/png', 200, 'PENDING_UPLOAD', ${u.id}, NOW() + INTERVAL '1 hour') RETURNING id;
    `;

    await sql`
      INSERT INTO project_media_assets (project_id, media_asset_id, is_cover, display_order)
      VALUES (${p.id}, ${m1.id}, true, 0);
    `;

    // second cover rejected
    await expect(sql`
      INSERT INTO project_media_assets (project_id, media_asset_id, is_cover, display_order)
      VALUES (${p.id}, ${m2.id}, true, 1);
    `).rejects.toThrow();

    // duplicate display_order rejected
    await expect(sql`
      INSERT INTO project_media_assets (project_id, media_asset_id, is_cover, display_order)
      VALUES (${p.id}, ${m2.id}, false, 0);
    `).rejects.toThrow();
  });

  it('8. Contact Messages invalid status, READ without read_at, ARCHIVED without archived_at rejected', async () => {
    await expect(sql`
      INSERT INTO contact_messages (sender_name, sender_email, subject, message_body, ip_address_hash, status)
      VALUES ('John', 'john@example.com', 'Sub', 'Body', 'hash123', 'INVALID');
    `).rejects.toThrow();

    await expect(sql`
      INSERT INTO contact_messages (sender_name, sender_email, subject, message_body, ip_address_hash, status)
      VALUES ('John', 'john@example.com', 'Sub', 'Body', 'hash123', 'READ');
    `).rejects.toThrow();

    await expect(sql`
      INSERT INTO contact_messages (sender_name, sender_email, subject, message_body, ip_address_hash, status)
      VALUES ('John', 'john@example.com', 'Sub', 'Body', 'hash123', 'ARCHIVED');
    `).rejects.toThrow();
  });

  it('9. FK RESTRICT policy on categories and users proven in PostgreSQL 16', async () => {
    const [c] =
      await sql`INSERT INTO categories (name, slug) VALUES ('Restrict Cat', 'restr-cat') RETURNING id;`;
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    await sql`
      INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
      VALUES ('Post Restr', 'post-restr', 'S', 'C', 'DRAFT', ${c.id}, ${u.id});
    `;

    await expect(sql`DELETE FROM categories WHERE id = ${c.id};`).rejects.toThrow();
  });

  it('10. FK CASCADE policy on junction table (post_tags) proven in PostgreSQL 16', async () => {
    const [u] = await sql`SELECT id FROM "user" LIMIT 1;`;
    const [c] = await sql`SELECT id FROM categories LIMIT 1;`;
    const [t] =
      await sql`INSERT INTO tags (name, slug) VALUES ('Real Tag', 'real-tag') RETURNING id;`;
    const [p] = await sql`
      INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
      VALUES ('Post Tag Casc', 'post-tag-casc', 'S', 'C', 'DRAFT', ${c.id}, ${u.id}) RETURNING id;
    `;

    await sql`INSERT INTO post_tags (post_id, tag_id) VALUES (${p.id}, ${t.id});`;

    // Delete post -> junction post_tags automatically deleted via CASCADE
    await sql`DELETE FROM posts WHERE id = ${p.id};`;
    const res = await sql`SELECT * FROM post_tags WHERE post_id = ${p.id};`;
    expect(res).toHaveLength(0);
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
