import { getContactSource } from "@kokoro/brain/people";
import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { contactListTable } from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import { CONTACTS_SYNC_QUEUE, consume } from "@kokoro/queues";

import { logger } from "../logger";

export const contactsSync = (): Consumer =>
  consume(
    CONTACTS_SYNC_QUEUE,
    async (message) => {
      const contactSource = getContactSource(message.source);

      if (message.contactListId) {
        const contactLists = await db
          .select()
          .from(contactListTable)
          .where(
            and(
              eq(contactListTable.id, message.contactListId),
              eq(
                contactListTable.platformAccountId,
                message.integrationAccountId,
              ),
            ),
          );

        if (contactLists.length === 0) {
          throw new Error("Contact list not found");
        }

        const contactList = contactLists[0];

        if (!message.platformContactId) {
          // Since no specific contact was requested, we'll sync all contacts
          await contactSource.syncContacts(
            message.integrationAccountId,
            contactList.id,
          );

          return;
        }

        const platformContact = await contactSource.fetchPlatformContact(
          message.integrationAccountId,
          message.platformContactId,
        );

        await contactSource.processContact(
          {
            userId: contactList.userId,
            platformAccountId: message.integrationAccountId,
            platformContactListId: contactList.platformContactListId,
            contactListId: contactList.id,
          },
          // biome-ignore lint/suspicious/noExplicitAny: idk, fix this mess. We need to guarantee a single source for types to match.
          platformContact as any,
        );

        return;
      }

      const contactLists = await db
        .select()
        .from(contactListTable)
        .where(
          and(
            eq(
              contactListTable.platformAccountId,
              message.integrationAccountId,
            ),
            eq(contactListTable.source, message.source),
          ),
        );

      await Promise.all(
        contactLists.map((contactList) =>
          contactSource.syncContacts(
            message.integrationAccountId,
            contactList.id,
          ),
        ),
      );
    },
    logger,
  );
