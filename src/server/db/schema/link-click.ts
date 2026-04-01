import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { link } from './link';

export const linkClick = pgTable('link_click', {
  id: uuid('id').primaryKey().defaultRandom(),

  bentoId: text('bento_id').notNull(),
  href: text('href').notNull(),

  ip: text('ip').notNull(),
  userAgent: text('user_agent').notNull(),
  referrer: text('referrer'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  linkId: uuid('link_id').notNull(),
});

export const linkClickRelations = relations(linkClick, ({ one }) => ({
  link: one(link, {
    fields: [linkClick.linkId],
    references: [link.id],
  }),
}));
