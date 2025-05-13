ALTER TABLE "calendar" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_event" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_task_attributes" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_tasks" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tasklists" ADD COLUMN "integration_account_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar" ADD CONSTRAINT "calendar_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event" ADD CONSTRAINT "memory_event_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_task_attributes" ADD CONSTRAINT "memory_task_attributes_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasklists" ADD CONSTRAINT "tasklists_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
