ALTER TABLE "google_account_details" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "external_google_calendar" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "google_account_details" CASCADE;--> statement-breakpoint
DROP TABLE "external_google_calendar" CASCADE;--> statement-breakpoint
ALTER TABLE "external_google_calendar_events_watchers" DROP CONSTRAINT "external_google_calendar_events_watchers_accountId_calendarId_unique";--> statement-breakpoint
ALTER TABLE "external_google_calendarlist_watchers" DROP CONSTRAINT "external_google_calendarlist_watchers_accountId_unique";--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "external_google_calendar_events_watchers" DROP CONSTRAINT "external_google_calendar_events_watchers_account_id_external_google_calendar_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "external_google_calendarlist_watchers" DROP CONSTRAINT "external_google_calendarlist_watchers_account_id_external_google_calendar_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tasklists" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "tasklists" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "integrations_accounts" ADD COLUMN "platform_data" jsonb;--> statement-breakpoint
ALTER TABLE "external_google_calendar_events_watchers" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "external_google_calendarlist_watchers" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendar_events_watchers" ADD CONSTRAINT "external_google_calendar_events_watchers_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendarlist_watchers" ADD CONSTRAINT "external_google_calendarlist_watchers_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "memory_event" DROP COLUMN IF EXISTS "recurring_event_platform_calendar_id";--> statement-breakpoint
ALTER TABLE "external_google_calendar_events_watchers" DROP COLUMN IF EXISTS "account_id";--> statement-breakpoint
ALTER TABLE "external_google_calendarlist_watchers" DROP COLUMN IF EXISTS "account_id";--> statement-breakpoint
ALTER TABLE "external_google_calendar_events_watchers" ADD CONSTRAINT "external_google_calendar_events_watchers_integrationAccountId_calendarId_unique" UNIQUE("integration_account_id","calendar_id");--> statement-breakpoint
ALTER TABLE "external_google_calendarlist_watchers" ADD CONSTRAINT "external_google_calendarlist_watchers_integrationAccountId_unique" UNIQUE("integration_account_id");