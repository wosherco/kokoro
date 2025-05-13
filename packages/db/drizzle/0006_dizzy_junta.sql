ALTER TABLE "memory_event" DROP CONSTRAINT "memory_event_platformAccountId_platformId_platformCalendarId_unique";--> statement-breakpoint
ALTER TABLE "memory_tasks" DROP CONSTRAINT "memory_tasks_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "memory_tasks" DROP CONSTRAINT "memory_tasks_memory_id_memory_id_fk";
--> statement-breakpoint
ALTER TABLE "memory_tasks" DROP CONSTRAINT "memory_tasks_tasklist_id_tasklists_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_memory_id_memory_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_tasklist_id_tasklists_id_fk" FOREIGN KEY ("tasklist_id") REFERENCES "public"."tasklists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "memory_event_attendants" ADD CONSTRAINT "memory_event_attendants_memoryEventId_email_unique" UNIQUE("memory_event_id","email");--> statement-breakpoint
ALTER TABLE "memory_event" ADD CONSTRAINT "memory_event_source_platformAccountId_platformId_platformCalendarId_unique" UNIQUE("source","platform_account_id","platform_id","platform_calendar_id");--> statement-breakpoint
ALTER TABLE "memory_task_attributes" ADD CONSTRAINT "memory_task_attributes_memoryTaskId_platformAttributeId_unique" UNIQUE("memory_task_id","platform_attribute_id");--> statement-breakpoint
ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_memoryId_unique" UNIQUE("memory_id");