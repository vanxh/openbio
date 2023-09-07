import { relations } from "drizzle-orm";
import { uuid, pgTable, timestamp, text, json } from "drizzle-orm/pg-core";
import type * as z from "zod";

import { sizeSchema, positionSchema, bentoSchema } from "@/types";
import { user } from "./user";
import { linkView } from "./link-view";

export { sizeSchema, positionSchema, bentoSchema };

export const link = pgTable("link", {
  id: uuid("id").primaryKey().defaultRandom(),

  link: text("link").unique().notNull(),

  image: text("image"),
  name: text("name").notNull(),
  bio: text("bio"),

  bento: json("bento")
    .$type<z.infer<typeof bentoSchema>[]>()
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
