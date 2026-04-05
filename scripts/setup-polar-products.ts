/**
 * Setup Polar products for OpenBio Pro plan.
 *
 * Usage:
 *   bun scripts/setup-polar-products.ts
 *
 * Required env vars:
 *   POLAR_ACCESS_TOKEN - Polar API access token
 *   POLAR_SERVER - "sandbox" or "production" (default: sandbox)
 *
 * This script will:
 *   1. Check if Pro Monthly and Pro Yearly products already exist
 *   2. Create them if they don't exist
 *   3. Update them if they do exist
 *   4. Print the product IDs to set in your .env
 */

import 'dotenv/config';
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  server: (process.env.POLAR_SERVER as 'sandbox' | 'production') ?? 'sandbox',
});

if (!process.env.POLAR_ACCESS_TOKEN) {
  console.error('Missing POLAR_ACCESS_TOKEN');
  process.exit(1);
}

async function findProduct(name: string) {
  const result = await polar.products.list({});

  for await (const page of result) {
    for (const product of page.result.items) {
      if (product.name === name) {
        return product;
      }
    }
  }

  return null;
}

async function setupMonthly() {
  const name = 'OpenBio Pro (Monthly)';
  const existing = await findProduct(name);

  if (existing) {
    console.log(`✓ Monthly product exists: ${existing.id}`);
    // Update description
    const updated = await polar.products.update({
      id: existing.id,
      productUpdate: {
        description:
          'Unlimited links, all card types, themes, custom domains, advanced analytics, verified badge, and priority support.',
      },
    });
    console.log(`  Updated: ${updated.name}`);
    return existing.id;
  }

  const product = await polar.products.create({
    name,
    description:
      'Unlimited links, all card types, themes, custom domains, advanced analytics, verified badge, and priority support.',
    recurringInterval: 'month',
    prices: [
      {
        amountType: 'fixed',
        priceCurrency: 'usd',
        priceAmount: 900, // $9.00
      },
    ],
  });

  console.log(`✓ Created monthly product: ${product.id}`);
  return product.id;
}

async function setupYearly() {
  const name = 'OpenBio Pro (Yearly)';
  const existing = await findProduct(name);

  if (existing) {
    console.log(`✓ Yearly product exists: ${existing.id}`);
    const updated = await polar.products.update({
      id: existing.id,
      productUpdate: {
        description:
          'Unlimited links, all card types, themes, custom domains, advanced analytics, verified badge, and priority support. Save 2 months with annual billing.',
      },
    });
    console.log(`  Updated: ${updated.name}`);
    return existing.id;
  }

  const product = await polar.products.create({
    name,
    description:
      'Unlimited links, all card types, themes, custom domains, advanced analytics, verified badge, and priority support. Save 2 months with annual billing.',
    recurringInterval: 'year',
    prices: [
      {
        amountType: 'fixed',
        priceCurrency: 'usd',
        priceAmount: 9000, // $90.00
      },
    ],
  });

  console.log(`✓ Created yearly product: ${product.id}`);
  return product.id;
}

async function main() {
  console.log(
    `Setting up Polar products (${process.env.POLAR_SERVER ?? 'sandbox'})...\n`
  );

  const monthlyId = await setupMonthly();
  const yearlyId = await setupYearly();

  console.log('\n--- Add these to your .env ---\n');
  console.log(`POLAR_PRO_MONTHLY_PRODUCT_ID=${monthlyId}`);
  console.log(`POLAR_PRO_YEARLY_PRODUCT_ID=${yearlyId}`);
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
