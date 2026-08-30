import { pgTable, uuid, varchar, text, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    summary: text('summary').notNull(),
    contentMarkdown: text('content_markdown').notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: uuid('archived_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('posts_status_check', sql`${table.status} IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')`),
    check(
      'posts_published_at_check',
      sql`${table.status} != 'PUBLISHED' OR ${table.publishedAt} IS NOT NULL`
    ),
    check(
      'posts_archived_at_check',
      sql`${table.status} != 'ARCHIVED' OR (${table.archivedAt} IS NOT NULL AND ${table.archivedByUserId} IS NOT NULL)`
    ),
    index('idx_posts_status_published_at').on(table.status, table.publishedAt),
    index('idx_posts_category_id').on(table.categoryId),
  ]
);
