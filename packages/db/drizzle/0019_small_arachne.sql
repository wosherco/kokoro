ALTER TABLE "contact_link" DROP CONSTRAINT "contact_link_contact_list_id_contact_list_id_fk";
--> statement-breakpoint
ALTER TABLE "contact_list" DROP CONSTRAINT "contact_list_integration_account_id_integrations_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "contact_link" ADD CONSTRAINT "contact_link_contact_list_id_contact_list_id_fk" FOREIGN KEY ("contact_list_id") REFERENCES "public"."contact_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_list" ADD CONSTRAINT "contact_list_integration_account_id_integrations_accounts_id_fk" FOREIGN KEY ("integration_account_id") REFERENCES "public"."integrations_accounts"("id") ON DELETE cascade ON UPDATE no action;