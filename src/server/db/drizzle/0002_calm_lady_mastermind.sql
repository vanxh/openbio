CREATE TABLE "link_click" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bento_id" text NOT NULL,
	"href" text NOT NULL,
	"ip" text NOT NULL,
	"user_agent" text NOT NULL,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"link_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link_view" ADD COLUMN "referrer" text;