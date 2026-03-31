# Drizzle Schema Guide

## Key Files
- Schema: `src/server/db/schema/`
- Client: `src/server/db/db.ts`
- Utils: `src/server/db/utils/`
- Config: `drizzle.config.ts`

## Tables
- user (Better Auth managed + plan, stripeCustomerId, subscriptionId, subscriptionEndsAt)
- session, account, verification (Better Auth managed)
- link (profile pages with bento JSON)
- link_view (analytics)

## Workflow: Edit schema -> `bun run db:generate` -> `bun run db:push`
## Primary keys: text type (Better Auth generates string IDs)
## Timestamps: always withTimezone: true
