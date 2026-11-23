import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { link } from './link';

export const emailSubscriber = pgTable(
  'email_subscriber',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    email: text('email').notNull(),

    linkId: uuid('link_id')
      .notNull()
      .references(() => link.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('email_subscriber_link_id_idx').on(table.linkId)]
);

export const emailSubscriberRelations = relations(
  emailSubscriber,
  ({ one }) => ({
    link: one(link, {
      fields: [emailSubscriber.linkId],
      references: [link.id],
    }),
  })
);
