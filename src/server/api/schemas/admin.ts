import { z } from 'zod';

export const adminPeriodSchema = z.object({
  days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
});

export const adminDirectorySchema = z.object({
  search: z.string().trim().max(100).default(''),
  page: z.number().int().min(1).max(100_000).default(1),
  plan: z.enum(['all', 'free', 'pro', 'business']).default('all'),
  visibility: z.enum(['all', 'listed', 'unlisted']).default('all'),
});

export const adminUpdateUserSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().trim().min(1).max(100),
  emailVerified: z.boolean(),
  aiCredits: z.number().int().min(0).max(100_000),
});

const FORMULA_PREFIX = /^\s*[=+@-]/;

/** Neutralize spreadsheet formulas as well as CSV delimiters. */
export function adminCsv(rows: (string | number | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? '');
          const safe = FORMULA_PREFIX.test(text) ? `'${text}` : text;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(',')
    )
    .join('\r\n');
}
