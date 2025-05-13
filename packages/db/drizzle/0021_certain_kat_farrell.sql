ALTER TABLE "oauth_client" ALTER COLUMN "client_secret" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "redirect_uris" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "scopes" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "oauth_client" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_client" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;