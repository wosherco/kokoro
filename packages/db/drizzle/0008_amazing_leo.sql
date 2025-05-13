CREATE TABLE IF NOT EXISTS "integrations_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"integration_type" varchar(255) NOT NULL,
	"platform_account_id" text NOT NULL,
	"email" text NOT NULL,
	"profile_picture" text,
	"platform_display_name" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invalid_grant" boolean DEFAULT false NOT NULL,
	CONSTRAINT "integrations_accounts_platformAccountId_integrationType_unique" UNIQUE("platform_account_id","integration_type"),
	CONSTRAINT "integrations_accounts_email_integrationType_unique" UNIQUE("email","integration_type")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integrations_accounts" ADD CONSTRAINT "integrations_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
