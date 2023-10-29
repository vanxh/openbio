import * as z from "zod";

export const sizeSchema = z
  .record(z.enum(["sm", "md"]), z.enum(["4x1", "2x2", "2x4", "4x2", "4x4"]))
  .default({
    sm: "2x2",
    md: "2x2",
  });

export const positionSchema = z
  .record(
    z.enum(["sm", "md"]),
    z
      .object({
        x: z.number().int().min(0).default(0),
        y: z.number().int().min(0).default(0),
      })
      .default({ x: 0, y: 0 })
  )
  .default({
    sm: { x: 0, y: 0 },
    md: { x: 0, y: 0 },
  });

export const linkBentoSchema = z.object({
  id: z.string(),
  type: z.literal("link"),

  href: z.string().url(),
  clicks: z.number().int().min(0).default(0),

  size: sizeSchema,
  position: positionSchema,
});

export const noteBentoSchema = z.object({
  id: z.string(),
  type: z.literal("note"),

  text: z.string(),

  size: sizeSchema,
  position: positionSchema,
});

export const assetBentoSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video"]),

  url: z.string().url(),
  caption: z.string().optional(),

  size: sizeSchema,
  position: positionSchema,
});

export const bentoSchema = linkBentoSchema
  .or(noteBentoSchema)
  .or(assetBentoSchema);

export const RESERVED_LINKS = [
  "sign-up",
  "sign-in",
  "claim",
  "api",
  "actions",
  "app",
  "create-link",
  "twitter",
  "github",
  "linkedin",
  "instagram",
  "telegram",
  "discord",
  "youtube",
  "twitch",
  "about",
  "pricing",
  "contact",
  "privacy",
  "terms",
  "legal",
  "blog",
  "docs",
  "support",
  "help",
  "status",
  "jobs",
  "press",
  "partners",
  "developers",
  "security",
  "cookies",
  "settings",
  "profile",
  "account",
  "dashboard",
  "admin",
  "login",
  "logout",
  "signout",
  "auth",
  "oauth",
  "openbio",
];

export const validLinkSchema = z
  .string()
  .min(3, {
    message: "Link must be at least 3 characters long.",
  })
  .max(50, {
    message: "Link must be at most 50 characters long.",
  })
  .regex(/^[a-z0-9-]+$/, {
    message: "Link must only contain lowercase letters, numbers, and dashes.",
  })
  .transform((value) => value.toLowerCase())
  .refine((value) => !RESERVED_LINKS.includes(value), {
    message: "This link is reserved.",
  });
