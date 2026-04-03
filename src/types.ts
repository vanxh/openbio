import * as z from 'zod';

export const SizeSchema = z
  .record(z.enum(['sm', 'md']), z.enum(['4x1', '2x2', '2x4', '4x2', '4x4']))
  .default({
    sm: '2x2',
    md: '2x2',
  });

export const PositionSchema = z
  .record(
    z.enum(['sm', 'md']),
    z
      .object({
        x: z.number().min(0).default(0),
        y: z.number().min(0).default(0),
      })
      .default({ x: 0, y: 0 })
  )
  .default({
    sm: { x: 0, y: 0 },
    md: { x: 0, y: 0 },
  });

export const LinkBentoSchema = z.object({
  id: z.string(),
  type: z.literal('link'),

  href: z.string().url(),
  clicks: z.number().int().min(0).default(0),

  size: SizeSchema,
  position: PositionSchema,
});

export const NoteBentoSchema = z.object({
  id: z.string(),
  type: z.literal('note'),

  text: z.string(),

  size: SizeSchema,
  position: PositionSchema,
});

export const AssetBentoSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),

  url: z.string(),
  caption: z.string().optional(),
  href: z.string().optional(),

  size: SizeSchema,
  position: PositionSchema,
});

export const MapBentoSchema = z.object({
  id: z.string(),
  type: z.literal('map'),

  latitude: z.number(),
  longitude: z.number(),
  label: z.string().optional(),

  size: SizeSchema,
  position: PositionSchema,
});

export const GithubBentoSchema = z.object({
  id: z.string(),
  type: z.literal('github'),

  username: z.string(),

  size: SizeSchema,
  position: PositionSchema,
});

export const EmailCollectBentoSchema = z.object({
  id: z.string(),
  type: z.literal('email-collect'),

  heading: z.string().optional(),
  description: z.string().optional(),
  buttonText: z.string().optional(),

  size: SizeSchema,
  position: PositionSchema,
});

export const CountdownBentoSchema = z.object({
  id: z.string(),
  type: z.literal('countdown'),

  title: z.string().optional(),
  targetDate: z.string(),
  emoji: z.string().optional(),
  repeat: z.enum(['none', 'yearly', 'monthly', 'weekly']).optional(),

  size: SizeSchema,
  position: PositionSchema,
});

export const WeatherBentoSchema = z.object({
  id: z.string(),
  type: z.literal('weather'),

  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string().optional(),

  size: SizeSchema,
  position: PositionSchema,
});

export const TwitterBentoSchema = z.object({
  id: z.string(),
  type: z.literal('twitter'),

  tweetId: z.string(),

  size: SizeSchema,
  position: PositionSchema,
});

export const CalendarBentoSchema = z.object({
  id: z.string(),
  type: z.literal('calendar'),

  url: z.string(), // Cal.com or Calendly URL
  title: z.string().optional(),
  description: z.string().optional(),

  size: SizeSchema,
  position: PositionSchema,
});

export const ViewsBentoSchema = z.object({
  id: z.string(),
  type: z.literal('views'),

  size: SizeSchema,
  position: PositionSchema,
});

export const BentoSchema = LinkBentoSchema.or(NoteBentoSchema)
  .or(AssetBentoSchema)
  .or(MapBentoSchema)
  .or(GithubBentoSchema)
  .or(EmailCollectBentoSchema)
  .or(CountdownBentoSchema)
  .or(WeatherBentoSchema)
  .or(TwitterBentoSchema)
  .or(CalendarBentoSchema)
  .or(ViewsBentoSchema);

export const RESERVED_LINKS = [
  'sign-up',
  'sign-in',
  'claim',
  'api',
  'actions',
  'app',
  'create-link',
  'twitter',
  'github',
  'linkedin',
  'instagram',
  'telegram',
  'discord',
  'youtube',
  'twitch',
  'about',
  'pricing',
  'contact',
  'privacy',
  'terms',
  'legal',
  'blog',
  'docs',
  'support',
  'help',
  'status',
  'jobs',
  'press',
  'partners',
  'developers',
  'security',
  'cookies',
  'settings',
  'profile',
  'account',
  'dashboard',
  'admin',
  'login',
  'logout',
  'signout',
  'auth',
  'oauth',
  'openbio',
];

export const ValidLinkSchema = z
  .string()
  .min(3, {
    message: 'Link must be at least 3 characters long.',
  })
  .max(50, {
    message: 'Link must be at most 50 characters long.',
  })
  .regex(/^[a-z0-9-]+$/, {
    message: 'Link must only contain lowercase letters, numbers, and dashes.',
  })
  .transform((value) => value.toLowerCase())
  .refine((value) => !RESERVED_LINKS.includes(value), {
    message: 'This link is reserved.',
  });

export type LinkBento = {
  id: string;
  type: 'link';
  href: string;
  clicks: number;

  size: z.infer<typeof SizeSchema>;
  position: z.infer<typeof PositionSchema>;
};
