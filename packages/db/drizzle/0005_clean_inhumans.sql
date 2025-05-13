CREATE TABLE IF NOT EXISTS "memory_task_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"memory_task_id" uuid NOT NULL,
	"platform_account_id" text NOT NULL,
	"platform_task_list_id" text NOT NULL,
	"platform_task_id" text NOT NULL,
	"platform_attribute_id" text NOT NULL,
	"source" varchar(255) NOT NULL,
	"state" varchar(255),
	"priority" integer,
	"platform_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_task_attributes_source_platformAccountId_platformTaskListId_platformTaskId_platformAttributeId_unique" UNIQUE("source","platform_account_id","platform_task_list_id","platform_task_id","platform_attribute_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"memory_id" uuid NOT NULL,
	"tasklist_id" uuid NOT NULL,
	"platform_account_id" text NOT NULL,
	"platform_task_list_id" text NOT NULL,
	"platform_task_id" text NOT NULL,
	"source" varchar(255) NOT NULL,
	"due_date" timestamp with time zone,
	"recurrence" text,
	"recurrence_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_tasks_source_platformAccountId_platformTaskListId_platformTaskId_unique" UNIQUE("source","platform_account_id","platform_task_list_id","platform_task_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform_account_id" text NOT NULL,
	"platform_task_list_id" text NOT NULL,
	"source" varchar(255) NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasklists_source_platformAccountId_platformTaskListId_unique" UNIQUE("source","platform_account_id","platform_task_list_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_task_attributes" ADD CONSTRAINT "memory_task_attributes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_task_attributes" ADD CONSTRAINT "memory_task_attributes_memory_task_id_memory_tasks_id_fk" FOREIGN KEY ("memory_task_id") REFERENCES "public"."memory_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_memory_id_memory_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_tasks" ADD CONSTRAINT "memory_tasks_tasklist_id_tasklists_id_fk" FOREIGN KEY ("tasklist_id") REFERENCES "public"."tasklists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasklists" ADD CONSTRAINT "tasklists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_task_attributes_user_id_index" ON "memory_task_attributes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_task_attributes_memory_task_id_index" ON "memory_task_attributes" USING btree ("memory_task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_tasks_user_id_index" ON "memory_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_tasks_memory_id_index" ON "memory_tasks" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_tasks_tasklist_id_index" ON "memory_tasks" USING btree ("tasklist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasklists_user_id_index" ON "tasklists" USING btree ("user_id");