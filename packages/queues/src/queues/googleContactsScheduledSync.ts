import { z } from "zod";

export const GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE =
  "google-contacts-scheduled-sync";

export const googleContactsScheduledSyncSchema = z.object({});

export type GoogleContactsScheduledSync = z.infer<
  typeof googleContactsScheduledSyncSchema
>;
