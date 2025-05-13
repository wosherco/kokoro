ALTER TABLE "tasklists" ADD COLUMN "last_synced" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "calendar" DROP COLUMN IF EXISTS "last_events_sync_at";