CREATE TABLE IF NOT EXISTS "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"payload" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform_calendar_id" text NOT NULL,
	"platform_account_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"summary" text,
	"summary_override" text,
	"description" text,
	"color" text,
	"color_override" text,
	"time_zone" text,
	"hidden" boolean DEFAULT false NOT NULL,
	"platform_data" json,
	"events_sync_token" text,
	"last_synced" timestamp with time zone,
	"last_events_sync_at" timestamp with time zone,
	"source" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_update" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_platformAccountId_platformCalendarId_unique" UNIQUE("platform_account_id","platform_calendar_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" integer NOT NULL,
	"feedback" text,
	"resolved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_email" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"email" text NOT NULL,
	"email_type" varchar DEFAULT 'other' NOT NULL,
	"display_name" text,
	"primary" boolean DEFAULT false NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"source" varchar NOT NULL,
	"photo_url" text,
	"external_source_id" text NOT NULL,
	"external_google_contact_list_id" uuid,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_link_externalSourceId_unique" UNIQUE("external_source_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_name" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"given_name" text NOT NULL,
	"middle_name" text,
	"family_name" text,
	"display_name" text NOT NULL,
	"primary" boolean DEFAULT false NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_event_attendants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memory_event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text,
	"email" text NOT NULL,
	"comment" text,
	"platform_attendee_id" text,
	"optional" boolean DEFAULT false NOT NULL,
	"organizer" boolean DEFAULT false NOT NULL,
	"status" varchar(255),
	"self" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"memory_id" uuid NOT NULL,
	"ical_uid" text NOT NULL,
	"platform_id" text NOT NULL,
	"platform_account_id" text NOT NULL,
	"platform_calendar_id" text NOT NULL,
	"calendar_id" uuid NOT NULL,
	"source" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"start_date_time_zone" text,
	"end_date" timestamp with time zone NOT NULL,
	"end_date_time_zone" text,
	"is_full_day" boolean DEFAULT false NOT NULL,
	"attendence_status" varchar(255) NOT NULL,
	"is_organizer" boolean DEFAULT false NOT NULL,
	"organizer_email" text,
	"is_creator" boolean DEFAULT true NOT NULL,
	"creator_email" text,
	"event_type" varchar(255) NOT NULL,
	"platform_data" json,
	"rrule" text,
	"recurring_end" timestamp with time zone,
	"recurring_event_platform_id" text,
	"recurring_event_platform_calendar_id" text,
	"start_original" timestamp with time zone,
	"start_original_time_zone" text,
	"deleted_instance" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memory_event_memoryId_unique" UNIQUE("memory_id"),
	CONSTRAINT "memory_event_platformAccountId_platformId_platformCalendarId_unique" UNIQUE("platform_account_id","platform_id","platform_calendar_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"content_embedding" vector(384),
	"description" text,
	"description_embedding" vector(384),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_update" timestamp with time zone DEFAULT now() NOT NULL,
	"source" varchar(255) NOT NULL,
	"interaction_source" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" varchar(255),
	"platform_id" text NOT NULL,
	"profile_picture" text,
	CONSTRAINT "account_platformId_unique" UNIQUE("platform_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"profile_picture" text,
	"whitelisted" boolean DEFAULT false NOT NULL,
	"role" varchar(255) DEFAULT 'USER' NOT NULL,
	"subscription_id" text,
	"stripe_customer_id" text,
	"subscribed_until" timestamp with time zone,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"alias" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "google_account_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"google_account_id" text NOT NULL,
	"email" text NOT NULL,
	"profile_picture" text,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invalid_grant" boolean DEFAULT false NOT NULL,
	CONSTRAINT "google_account_details_googleAccountId_type_unique" UNIQUE("google_account_id","type"),
	CONSTRAINT "google_account_details_email_type_unique" UNIQUE("email","type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_google_calendar_events_watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"calendar_id" text NOT NULL,
	"secret" text NOT NULL,
	"resource_id" text,
	"expiry_date" timestamp with time zone NOT NULL,
	CONSTRAINT "external_google_calendar_events_watchers_accountId_calendarId_unique" UNIQUE("account_id","calendar_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_google_calendarlist_watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"secret" text NOT NULL,
	"resource_id" text,
	"expiry_date" timestamp with time zone NOT NULL,
	CONSTRAINT "external_google_calendarlist_watchers_accountId_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_google_calendar" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"url_id" text NOT NULL,
	"google_account_details" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"calendars_sync_token" text,
	"last_calendars_sync_at" timestamp with time zone,
	CONSTRAINT "external_google_calendar_urlId_unique" UNIQUE("url_id"),
	CONSTRAINT "external_google_calendar_googleAccountDetails_unique" UNIQUE("google_account_details")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_google_contacts_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"google_account_id" text NOT NULL,
	"google_account_details" uuid NOT NULL,
	"type" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_token" text,
	"last_sync_at" timestamp with time zone,
	CONSTRAINT "external_google_contacts_list_googleAccountDetails_type_unique" UNIQUE("google_account_details","type")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar" ADD CONSTRAINT "calendar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_feedback" ADD CONSTRAINT "chat_feedback_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat" ADD CONSTRAINT "chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_email" ADD CONSTRAINT "contact_email_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_email" ADD CONSTRAINT "contact_email_link_id_contact_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."contact_link"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_external_google_contact_list_id_external_google_contacts_list_id_fk" FOREIGN KEY ("external_google_contact_list_id") REFERENCES "public"."external_google_contacts_list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_name" ADD CONSTRAINT "contact_name_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_name" ADD CONSTRAINT "contact_name_link_id_contact_link_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."contact_link"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event_attendants" ADD CONSTRAINT "memory_event_attendants_memory_event_id_memory_event_id_fk" FOREIGN KEY ("memory_event_id") REFERENCES "public"."memory_event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event_attendants" ADD CONSTRAINT "memory_event_attendants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event" ADD CONSTRAINT "memory_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event" ADD CONSTRAINT "memory_event_memory_id_memory_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memory"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event" ADD CONSTRAINT "memory_event_calendar_id_calendar_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendar"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_event" ADD CONSTRAINT "memory_event_recurring_event_platform_id_recurring_event_platform_calendar_id_platform_account_id_memory_event_platform_id_platform_calendar_id_platform_account_id_fk" FOREIGN KEY ("recurring_event_platform_id","recurring_event_platform_calendar_id","platform_account_id") REFERENCES "public"."memory_event"("platform_id","platform_calendar_id","platform_account_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory" ADD CONSTRAINT "memory_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory" ADD CONSTRAINT "memory_interaction_source_chat_id_fk" FOREIGN KEY ("interaction_source") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "google_account_details" ADD CONSTRAINT "google_account_details_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendar_events_watchers" ADD CONSTRAINT "external_google_calendar_events_watchers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendar_events_watchers" ADD CONSTRAINT "external_google_calendar_events_watchers_account_id_external_google_calendar_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."external_google_calendar"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendarlist_watchers" ADD CONSTRAINT "external_google_calendarlist_watchers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendarlist_watchers" ADD CONSTRAINT "external_google_calendarlist_watchers_account_id_external_google_calendar_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."external_google_calendar"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendar" ADD CONSTRAINT "external_google_calendar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_calendar" ADD CONSTRAINT "external_google_calendar_google_account_details_google_account_details_id_fk" FOREIGN KEY ("google_account_details") REFERENCES "public"."google_account_details"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_contacts_list" ADD CONSTRAINT "external_google_contacts_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "external_google_contacts_list" ADD CONSTRAINT "external_google_contacts_list_google_account_details_google_account_details_id_fk" FOREIGN KEY ("google_account_details") REFERENCES "public"."google_account_details"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "calendar_user_id_index" ON "calendar" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_event_attendants_user_id_index" ON "memory_event_attendants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_event_attendants_memory_event_id_index" ON "memory_event_attendants" USING btree ("memory_event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_content_embedding_index" ON "memory" USING hnsw ("content_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memory_description_embedding_index" ON "memory" USING hnsw ("description_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_google_calendar_user_id_index" ON "external_google_calendar" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_google_contacts_list_user_id_index" ON "external_google_contacts_list" USING btree ("user_id");