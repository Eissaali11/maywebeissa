import {
  pgTable,
  uuid,
  varchar,
  bigint,
  timestamp,
  check,
  index,
  primaryKey,
  unique,
  uniqueIndex,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { posts } from './posts';
import { projects } from './projects';

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    filename: varchar('filename', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 500 }).notNull().unique(),
    publicUrl: varchar('public_url', { length: 500 }),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'bigint' }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    uploadedByUserId: uuid('uploaded_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    uploadExpiresAt: timestamp('upload_expires_at', {
      withTimezone: true,
    }).notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: uuid('archived_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'media_assets_status_check',
      sql`${table.status} IN ('PENDING_UPLOAD', 'ACTIVE', 'ARCHIVED')`
    ),
    check(
      'media_assets_pending_check',
      sql`${table.status} != 'PENDING_UPLOAD' OR ${table.uploadExpiresAt} IS NOT NULL`
    ),
    check(
      'media_assets_active_check',
      sql`${table.status} != 'ACTIVE' OR (${table.publicUrl} IS NOT NULL AND ${table.uploadedAt} IS NOT NULL)`
    ),
    check(
      'media_assets_archived_check',
      sql`${table.status} != 'ARCHIVED' OR ${table.archivedAt} IS NOT NULL`
    ),
    index('idx_media_assets_status_expires').on(table.status, table.uploadExpiresAt),
  ]
);

export const postMediaAssets = pgTable(
  'post_media_assets',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'restrict' }),
    isCover: boolean('is_cover').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.mediaAssetId] }),
    unique('post_media_assets_display_order_unique').on(table.postId, table.displayOrder),
    uniqueIndex('idx_post_media_single_cover')
      .on(table.postId)
      .where(sql`${table.isCover} = true`),
    index('idx_post_media_asset_id').on(table.mediaAssetId),
  ]
);

export const projectMediaAssets = pgTable(
  'project_media_assets',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'restrict' }),
    isCover: boolean('is_cover').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.mediaAssetId] }),
    unique('project_media_assets_display_order_unique').on(table.projectId, table.displayOrder),
    uniqueIndex('idx_project_media_single_cover')
      .on(table.projectId)
      .where(sql`${table.isCover} = true`),
    index('idx_project_media_asset_id').on(table.mediaAssetId),
  ]
);
