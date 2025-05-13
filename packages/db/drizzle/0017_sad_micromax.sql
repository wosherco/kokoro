CREATE TABLE "linear_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"secret" text NOT NULL,
	"state" varchar(255) DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "linear_webhooks_workspaceId_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "actions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "actions" CASCADE;--> statement-breakpoint
ALTER TABLE "calendar" ALTER COLUMN "platform_data" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "memory_event" ALTER COLUMN "platform_data" SET DATA TYPE jsonb;