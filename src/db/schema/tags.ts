import { pgTable, uuid, varchar, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { posts } from './posts';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 40 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index('idx_post_tags_tag_id').on(table.tagId),
  ]
);
