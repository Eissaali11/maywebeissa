import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

describe('DATA-FOUNDATION-001 — Real PostgreSQL 16 Integration & Immutability Proof', () => {
  let sqlClient: postgres.Sql;

  beforeAll(async () => {
    sqlClient = process.env.TEST_DATABASE_URL
      ? postgres(process.env.TEST_DATABASE_URL, { max: 1 })
      : postgres({
          host: 'localhost',
          port: 5433,
          database: 'portfolio_test_db',
          username: 'postgres',
          password: 'postgrespassword',
          max: 1,
        });

    await sqlClient`DROP SCHEMA public CASCADE;`;
    await sqlClient`CREATE SCHEMA public;`;

    const drizzleDir = path.join(process.cwd(), 'drizzle');
    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      const migrationSql = fs.readFileSync(path.join(drizzleDir, file), 'utf-8');
      await sqlClient.unsafe(migrationSql);
    }
  }, 15000);

  afterAll(async () => {
    if (sqlClient) {
      await sqlClient.end();
    }
  }, 15000);

  it('1. Real Postgres 16 Migration-From-Zero: all 16 tables created', async () => {
    const res = await sqlClient<
      { table_name: string }[]
    >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
    const tableNames = res.map((r) => r.table_name);

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

  it('AUTH-SCHEMA-001 (Real PG16): Better Auth core tables exist', async () => {
    const res = await sqlClient<
      { table_name: string }[]
    >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
    const tableNames = res.map((r) => r.table_name);
    for (const t of ['user', 'session', 'account', 'verification']) {
      expect(tableNames).toContain(t);
    }
  });

  it('AUTH-SCHEMA-002 (Real PG16): user table does NOT contain password_hash column', async () => {
    const res = await sqlClient<
      { column_name: string }[]
    >`SELECT column_name FROM information_schema.columns WHERE table_name = 'user';`;
    const cols = res.map((c) => c.column_name);
    expect(cols).not.toContain('password_hash');
  });

  it('AUTH-SCHEMA-003 (Real PG16): credential password exists in account.password', async () => {
    const res = await sqlClient<
      { column_name: string }[]
    >`SELECT column_name FROM information_schema.columns WHERE table_name = 'account';`;
    const cols = res.map((c) => c.column_name);
    expect(cols).toContain('password');
  });

  it('AUTH-SCHEMA-004 (Real PG16): account contains Better Auth 1.7.2 required identity fields', async () => {
    const res = await sqlClient<
      { column_name: string }[]
    >`SELECT column_name FROM information_schema.columns WHERE table_name = 'account';`;
    const cols = res.map((c) => c.column_name);
    expect(cols).toContain('issuer');
    expect(cols).toContain('account_id');
    expect(cols).toContain('provider_id');
    expect(cols).toContain('id_token');
  });

  it('2. Real Postgres 16 pgcrypto & Single-Admin Guard', async () => {
    await sqlClient`DELETE FROM "user";`;
    await sqlClient`INSERT INTO "user" (name, email, role) VALUES ('Admin One', 'admin1@real.com', 'ADMIN');`;

    await expect(
      sqlClient`INSERT INTO "user" (name, email, role) VALUES ('Admin Two', 'admin2@real.com', 'ADMIN');`
    ).rejects.toThrow();
  });

  it('AUTH-SCHEMA-005 (Real PG16): composite unique index on (issuer, account_id) is enforced', async () => {
    const users = await sqlClient<{ id: string }[]>`SELECT id FROM "user" LIMIT 1;`;
    const userId = users[0].id;

    await sqlClient`INSERT INTO account (user_id, issuer, account_id, provider_id) VALUES (${userId}, 'https://auth.example.com', 'acc1', 'credential');`;

    await expect(
      sqlClient`INSERT INTO account (user_id, issuer, account_id, provider_id) VALUES (${userId}, 'https://auth.example.com', 'acc1', 'credential');`
    ).rejects.toThrow();
  });

  it('3. Real Postgres 16 Case-Insensitive lower(slug) Unique Index', async () => {
    await sqlClient`INSERT INTO categories (name, slug) VALUES ('Web Dev', 'web-dev');`;

    await expect(
      sqlClient`INSERT INTO categories (name, slug) VALUES ('Web Development', 'WEB-DEV');`
    ).rejects.toThrow();
  });

  it('4. Real Postgres 16 Project Type Constraint', async () => {
    await expect(
      sqlClient`INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
       VALUES ('P1', 'p1', 'S', 'D', 'INVALID_TYPE', 'DRAFT');`
    ).rejects.toThrow();

    await sqlClient`INSERT INTO projects (title, slug, summary, description_markdown, project_type, status)
     VALUES ('P1', 'p1', 'S', 'D', 'WEB_SYSTEM', 'DRAFT');`;
  });

  it('5. Real Postgres 16 Media Assets Attributes & Positive Checks', async () => {
    const users = await sqlClient<{ id: string }[]>`SELECT id FROM "user" LIMIT 1;`;
    const adminId = users[0].id;

    await expect(
      sqlClient`INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('file.png', 'k1', 'image/png', -100, 'PENDING_UPLOAD', ${adminId}, NOW() + INTERVAL '1 hour');`
    ).rejects.toThrow();

    await sqlClient`INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, alt_text, width, height, checksum, status, uploaded_by_user_id, upload_expires_at)
     VALUES ('file.png', 'k1', 'image/png', 2048, 'Alt text example', 1920, 1080, 'a1b2c3d4e5f6', 'PENDING_UPLOAD', ${adminId}, NOW() + INTERVAL '1 hour');`;
  });

  it('6. Real Postgres 16 Single Cover Partial Index Constraint', async () => {
    const users = await sqlClient<{ id: string }[]>`SELECT id FROM "user" LIMIT 1;`;
    const adminId = users[0].id;

    const cats = await sqlClient<{ id: string }[]>`SELECT id FROM categories LIMIT 1;`;
    const catId = cats[0].id;

    const postRes = await sqlClient<
      { id: string }[]
    >`INSERT INTO posts (title, slug, summary, content_markdown, status, category_id, author_id)
     VALUES ('Post 1', 'post-1', 'S', 'C', 'DRAFT', ${catId}, ${adminId}) RETURNING id;`;
    const postId = postRes[0].id;

    const m1Res = await sqlClient<
      { id: string }[]
    >`INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
     VALUES ('m1.png', 'm1key', 'image/png', 100, 'PENDING_UPLOAD', ${adminId}, NOW() + INTERVAL '1 hour') RETURNING id;`;
    const m1Id = m1Res[0].id;

    const m2Res = await sqlClient<
      { id: string }[]
    >`INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
     VALUES ('m2.png', 'm2key', 'image/png', 200, 'PENDING_UPLOAD', ${adminId}, NOW() + INTERVAL '1 hour') RETURNING id;`;
    const m2Id = m2Res[0].id;

    await sqlClient`INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
     VALUES (${postId}, ${m1Id}, true, 0);`;

    await expect(
      sqlClient`INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
       VALUES (${postId}, ${m2Id}, true, 1);`
    ).rejects.toThrow();
  });

  it('7. Real Postgres 16 Audit Log Immutability: UPDATE, DELETE, and TRUNCATE rejected', async () => {
    const users = await sqlClient<{ id: string }[]>`SELECT id FROM "user" LIMIT 1;`;
    const adminId = users[0].id;

    const auditRes = await sqlClient<
      { id: string }[]
    >`INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata_json)
     VALUES (${adminId}, 'CREATE_POST', 'POST', '{"post_id": "123"}') RETURNING id;`;
    const auditId = auditRes[0].id;

    await expect(
      sqlClient`UPDATE audit_logs SET action = 'MODIFIED' WHERE id = ${auditId};`
    ).rejects.toThrow(/audit_logs is an append-only immutable table/);

    await expect(sqlClient`DELETE FROM audit_logs WHERE id = ${auditId};`).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );

    await expect(sqlClient`TRUNCATE TABLE audit_logs;`).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );
  });
});
