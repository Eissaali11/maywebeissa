import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const technologies = pgTable('technologies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  iconName: varchar('icon_name', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
