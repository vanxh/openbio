import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { link } from "./link";

export const linkView = pgTable("link_view", {
  id: uuid("id").primaryKey().defaultRandom(),

  ip: text("ip").notNull(),
  userAgent: text("user_agent").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  linkId: uuid("link_id").notNull(),
});

export const linkViewRelations = relations(linkView, ({ one }) => ({
  link: one(link, {
    fields: [linkView.linkId],
    references: [link.id],
  }),
}));
