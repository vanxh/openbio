import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { link } from './link';

export const linkView = pgTable(
  'link_view',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    ip: text('ip').notNull(),
    userAgent: text('user_agent').notNull(),
    referrer: text('referrer'),
    country: varchar('country', { length: 2 }), // ISO 3166-1 alpha-2

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    linkId: uuid('link_id').notNull(),
  },
  (table) => [
    // Every analytics query filters by profile and a time window, and each
    // page view first checks for a recent view from the same visitor. Without
    // this the table is scanned in full on every profile load.
    index('link_view_link_id_created_at_idx').on(table.linkId, table.createdAt),
  ]
);

export const linkViewRelations = relations(linkView, ({ one }) => ({
  link: one(link, {
    fields: [linkView.linkId],
    references: [link.id],
  }),
}));
