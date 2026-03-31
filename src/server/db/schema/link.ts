import type { BentoSchema } from '@/types';
export { PositionSchema, SizeSchema, BentoSchema } from '@/types';
import { relations } from 'drizzle-orm';
import {
  boolean,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type * as z from 'zod';
import { linkView } from './link-view';
import { user } from './user';

export const link = pgTable('link', {
  id: uuid('id').primaryKey().defaultRandom(),

  link: text('link').unique().notNull(),

  image: text('image'),
  name: text('name').notNull(),
  bio: text('bio'),

  bento: json('bento')
    .$type<z.infer<typeof BentoSchema>[]>()
    .default([])
    .notNull(),

  theme: text('theme').default('default').notNull(),
  accentColor: text('accent_color'),
  darkMode: boolean('dark_mode').default(false).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

  userId: text('user_id').notNull(),
});

export const linkRelations = relations(link, ({ one, many }) => ({
  user: one(user, {
    fields: [link.userId],
    references: [user.id],
  }),
  views: many(linkView),
}));
