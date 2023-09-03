import { relations } from "drizzle-orm";
import { uuid, pgTable, timestamp, text, pgEnum } from "drizzle-orm/pg-core";

import { link } from "./link";

const plan = pgEnum("plan", ["free", "pro"]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: text("provider_id").unique(),

  email: text("email").unique().notNull(),
  firstName: text("first_name").default(""),
  lastName: text("last_name").default(""),

  plan: plan("plan").default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionId: text("subscription_id"),
  subscriptionEndsAt: timestamp("subscription_ends_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  links: many(link),
}));
