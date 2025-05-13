import { z } from "zod";

import { CONTACT_SOURCES } from "@kokoro/validators/db";

export const CONTACTS_SYNC_QUEUE = "contacts-sync";

export const contactsSyncSchema = z.object({
  integrationAccountId: z.string(),
  source: z.enum(CONTACT_SOURCES),
  contactListId: z.string().optional(),
  platformContactId: z.string().optional(),
});

export type ContactsSync = z.infer<typeof contactsSyncSchema>;
