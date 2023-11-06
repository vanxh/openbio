import { relations } from "drizzle-orm";
import { json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type * as z from "zod";
import { BentoSchema, PositionSchema, SizeSchema } from "@/types";
import { linkView } from "./link-view";
import { user } from "./user";

export { SizeSchema, PositionSchema, BentoSchema };

export const link = pgTable("link", {
  id: uuid("id").primaryKey().defaultRandom(),

  link: text("link").unique().notNull(),

  image: text("image"),
  name: text("name").notNull(),
  bio: text("bio"),

  bento: json("bento")
    .$type<z.infer<typeof BentoSchema>[]>()
    .default([])
    .notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  userId: uuid("user_id").notNull(),
});

export const linkRelations = relations(link, ({ one, many }) => ({
  user: one(user, {
    fields: [link.userId],
    references: [user.id],
  }),
  views: many(linkView),
}));
