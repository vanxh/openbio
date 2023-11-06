import * as z from "zod";
import { BentoSchema, ValidLinkSchema } from "@/types";

export const LinkAvailableSchema = z.object({
  link: z.string().toLowerCase(),
});

export const CreateLinkSchema = z.object({
  link: ValidLinkSchema,
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  youtube: z.string().optional(),
  twitch: z.string().optional(),
});

export const GetByLinkSchema = z.object({
  link: z.string(),
});

export const GetLinkViewsSchema = z.object({
  id: z.string(),
});

export const UpdateLinkSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  bio: z.string().optional(),
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
