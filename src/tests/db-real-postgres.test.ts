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

    // Clean public schema on real PostgreSQL 16
    await sqlClient`DROP SCHEMA public CASCADE;`;
    await sqlClient`CREATE SCHEMA public;`;

    // Read and apply full migration SQL in a single query execution
    const migrationPath = path.join(process.cwd(), 'drizzle', '0000_clean_korvac.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    await sqlClient.unsafe(migrationSql);
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

  it('2. Real Postgres 16 pgcrypto & Single-Admin Guard', async () => {
    await sqlClient`INSERT INTO "user" (name, email, role) VALUES ('Admin One', 'admin1@real.com', 'ADMIN');`;

    await expect(
      sqlClient`INSERT INTO "user" (name, email, role) VALUES ('Admin Two', 'admin2@real.com', 'ADMIN');`
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

    // Check negative file size
    await expect(
      sqlClient`INSERT INTO media_assets (filename, storage_key, mime_type, file_size_bytes, status, uploaded_by_user_id, upload_expires_at)
       VALUES ('file.png', 'k1', 'image/png', -100, 'PENDING_UPLOAD', ${adminId}, NOW() + INTERVAL '1 hour');`
    ).rejects.toThrow();

    // Valid insert with alt_text, width, height, checksum
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

    // Attach Media 1 as cover
    await sqlClient`INSERT INTO post_media_assets (post_id, media_asset_id, is_cover, display_order)
     VALUES (${postId}, ${m1Id}, true, 0);`;

    // Attempt to attach Media 2 as cover MUST FAIL
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

    // 1. UPDATE -> MUST FAIL
    await expect(
      sqlClient`UPDATE audit_logs SET action = 'MODIFIED' WHERE id = ${auditId};`
    ).rejects.toThrow(/audit_logs is an append-only immutable table/);

    // 2. DELETE -> MUST FAIL
    await expect(sqlClient`DELETE FROM audit_logs WHERE id = ${auditId};`).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );

    // 3. TRUNCATE -> MUST FAIL
    await expect(sqlClient`TRUNCATE TABLE audit_logs;`).rejects.toThrow(
      /audit_logs is an append-only immutable table/
    );
  });
});
