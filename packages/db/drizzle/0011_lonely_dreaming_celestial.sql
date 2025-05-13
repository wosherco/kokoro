CREATE TABLE IF NOT EXISTS "contact_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform_account_id" text NOT NULL,
	"platform_contact_list_id" text NOT NULL,
	"source" varchar NOT NULL,
	"name" text NOT NULL,
	"platform_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "contact_list_platformAccountId_platformContactListId_source_unique" UNIQUE("platform_account_id","platform_contact_list_id","source"),
	CONSTRAINT "contact_list_userId_platformAccountId_platformContactListId_source_unique" UNIQUE("user_id","platform_account_id","platform_contact_list_id","source")
);
--> statement-breakpoint
ALTER TABLE "external_google_contacts_list" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "external_google_contacts_list" CASCADE;--> statement-breakpoint
ALTER TABLE "contact_link" DROP CONSTRAINT "contact_link_externalSourceId_unique";--> statement-breakpoint
ALTER TABLE "contact_email" ADD COLUMN "platform_data" jsonb;--> statement-breakpoint
ALTER TABLE "contact_link" ADD COLUMN "contact_list_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_link" ADD COLUMN "platform_account_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_link" ADD COLUMN "platform_contact_list_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_link" ADD COLUMN "platform_contact_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_list" ADD CONSTRAINT "contact_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_list_user_id_index" ON "contact_list" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_contact_list_id_contact_list_id_fk" FOREIGN KEY ("contact_list_id") REFERENCES "public"."contact_list"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_link_user_id_index" ON "contact_link" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "contact_email" DROP COLUMN IF EXISTS "email_type";--> statement-breakpoint
ALTER TABLE "contact_link" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "contact_link" DROP COLUMN IF EXISTS "external_source_id";--> statement-breakpoint
ALTER TABLE "contact_link" DROP COLUMN IF EXISTS "external_google_contact_list_id";--> statement-breakpoint
ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_platformAccountId_platformContactId_platformContactListId_source_unique" UNIQUE("platform_account_id","platform_contact_id","platform_contact_list_id","source");--> statement-breakpoint
ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_userId_platformAccountId_platformContactId_platformContactListId_source_unique" UNIQUE("user_id","platform_account_id","platform_contact_id","platform_contact_list_id","source");