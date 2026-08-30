import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  check,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { technologies } from './technologies';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    summary: text('summary').notNull(),
    descriptionMarkdown: text('description_markdown').notNull(),
    liveUrl: varchar('live_url', { length: 500 }),
    githubUrl: varchar('github_url', { length: 500 }),
    isFeatured: boolean('is_featured').notNull().default(false),
    status: varchar('status', { length: 20 }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: uuid('archived_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('projects_status_check', sql`${table.status} IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')`),
    check(
      'projects_published_at_check',
      sql`${table.status} != 'PUBLISHED' OR ${table.publishedAt} IS NOT NULL`
    ),
    check(
      'projects_archived_at_check',
      sql`${table.status} != 'ARCHIVED' OR (${table.archivedAt} IS NOT NULL AND ${table.archivedByUserId} IS NOT NULL)`
    ),
    index('idx_projects_featured_status').on(table.isFeatured, table.status, table.publishedAt),
  ]
);

export const projectTechnologies = pgTable(
  'project_technologies',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    technologyId: uuid('technology_id')
      .notNull()
      .references(() => technologies.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.technologyId] }),
    index('idx_project_technologies_tech_id').on(table.technologyId),
  ]
);
