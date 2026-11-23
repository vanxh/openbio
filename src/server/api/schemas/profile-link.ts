import { MAX_BENTO_CARDS } from '@/lib/bento-limits';
import { BentoSchema, PositionSchema, ValidLinkSchema } from '@/types';
import * as z from 'zod';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'openbio.app';

// One or more dot-separated labels plus a TLD, e.g. `bio.example.com`.
const DOMAIN_RE =
  /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

// The accent colour is written into a `style` attribute, so allow only the
// characters a colour needs (hex, names, rgb()/hsl()/oklch()) and nothing that
// could end the declaration or open a url().
const CSS_COLOR_RE = /^[#a-z0-9(),.%\s/-]{1,64}$/i;

/**
 * A hostname someone can point at their profile. Normalised to lowercase so
 * it matches the `Host` header the proxy looks profiles up by, and never the
 * app's own domain or one of its subdomains.
 */
export const CustomDomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(DOMAIN_RE, { message: 'Enter a valid domain, like bio.example.com.' })
  .refine(
    (domain) => domain !== ROOT_DOMAIN && !domain.endsWith(`.${ROOT_DOMAIN}`),
    { message: `Use a domain you own, not ${ROOT_DOMAIN}.` }
  );

export const LinkAvailableSchema = z.object({
  link: z.string().toLowerCase(),
});

const SocialHandleSchema = z.string().trim().max(200).optional();

export const CreateLinkSchema = z.object({
  link: ValidLinkSchema,
  name: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  twitter: SocialHandleSchema,
  github: SocialHandleSchema,
  linkedin: SocialHandleSchema,
  instagram: SocialHandleSchema,
  telegram: SocialHandleSchema,
  discord: SocialHandleSchema,
  youtube: SocialHandleSchema,
  twitch: SocialHandleSchema,
});

export const GetByLinkSchema = z.object({
  link: z.string(),
});

export const GetLinkViewsSchema = z.object({
  id: z.string(),
});

export const UpdateLinkSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(100).optional(),
  // Rich-text HTML from the bio editor, so the cap is well above visible length.
  bio: z.string().max(20_000).optional(),
  theme: z.string().max(50).optional(),
  accentColor: z
    .string()
    .trim()
    .regex(CSS_COLOR_RE, { message: 'Enter a valid colour, like #7c3aed.' })
    .nullable()
    .optional(),
  darkMode: z.boolean().optional(),
  customDomain: CustomDomainSchema.nullable().optional(),
  customFooter: z.string().trim().max(200).nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const DeleteLinkSchema = z.object({
  link: z.string(),
});

export const CreateLinkBentoSchema = z.object({
  link: z.string(),
  bento: BentoSchema,
});

export const DeleteLinkBentoSchema = z.object({
  link: z.string(),
  id: z.string(),
});

export const UpdateLinkBentoSchema = z.object({
  link: z.string(),
  bento: BentoSchema,
});

export const UpdateLinkBentoPositionsSchema = z.object({
  link: z.string(),
  positions: z
    .record(z.string(), PositionSchema)
    .refine((positions) => Object.keys(positions).length <= MAX_BENTO_CARDS, {
      message: 'Too many cards.',
    }),
});

export const SetLinkBentoSchema = z.object({
  link: z.string(),
  bento: z.array(BentoSchema).max(MAX_BENTO_CARDS),
});
