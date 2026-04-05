ALTER TABLE "user" ADD COLUMN "ai_credits" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "ai_credits_reset_at" timestamp with time zone;
