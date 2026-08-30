import { pgTable, uuid, varchar, text, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderName: varchar('sender_name', { length: 100 }).notNull(),
    senderEmail: varchar('sender_email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 200 }).notNull(),
    messageBody: text('message_body').notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    ipAddressHash: varchar('ip_address_hash', { length: 64 }).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: uuid('archived_by_user_id').references(() => user.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('contact_messages_status_check', sql`${table.status} IN ('UNREAD', 'READ', 'ARCHIVED')`),
    check(
      'contact_messages_read_check',
      sql`${table.status} != 'READ' OR ${table.readAt} IS NOT NULL`
    ),
    check(
      'contact_messages_archived_check',
      sql`${table.status} != 'ARCHIVED' OR ${table.archivedAt} IS NOT NULL`
    ),
    index('idx_contact_messages_status_created_at').on(table.status, table.createdAt),
  ]
);
