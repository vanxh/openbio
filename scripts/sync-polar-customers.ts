/**
 * Sync existing users to Polar as customers.
 *
 * Usage:
 *   bun scripts/sync-polar-customers.ts
 *
 * Required env vars:
 *   POLAR_ACCESS_TOKEN
 *   POLAR_SERVER (default: sandbox)
 *   DATABASE_URL
 *
 * Creates a Polar customer for each user that doesn't already have one.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { Polar } from '@polar-sh/sdk';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text } from 'drizzle-orm/pg-core';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  server: (process.env.POLAR_SERVER as 'sandbox' | 'production') ?? 'sandbox',
});

const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  polarCustomerId: text('polar_customer_id'),
});

const sql = neon(process.env.DATABASE_URL ?? '');
const db = drizzle(sql);

async function main() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      polarCustomerId: user.polarCustomerId,
    })
    .from(user);

  console.log(`Found ${users.length} users\n`);

  let created = 0;
  let skipped = 0;

  for (const u of users) {
    if (u.polarCustomerId) {
      console.log(
        `  skip ${u.email} (already has customer: ${u.polarCustomerId})`
      );
      skipped++;
      continue;
    }

    try {
      const customer = await polar.customers.create({
        email: u.email,
        name: u.name,
        externalId: u.id,
      });

      await db
        .update(user)
        .set({ polarCustomerId: customer.id })
        .where(eq(user.id, u.id));

      console.log(`  ✓ ${u.email} → ${customer.id}`);
      created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${u.email}: ${msg}`);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
