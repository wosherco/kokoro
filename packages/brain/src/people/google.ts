import { and, eq } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db } from "@kokoro/db/client";
import { contactListTable } from "@kokoro/db/schema";
import { withGoogleAccount } from "@kokoro/google";
import type { GooglePerson } from "@kokoro/google/people";
import { syncContacts } from "@kokoro/google/people";
import { GOOGLE_EMAIL_TYPE, GOOGLE_PEOPLE } from "@kokoro/validators/db";

import { google } from "googleapis";
import { checkEnum } from "../utils/google";
import type { DeletableContactData, ProcessContactContext } from "./base";
import { ReadOnlyContactsSource } from "./base";
import { processContactData } from "./common";

export class GoogleContactsSource extends ReadOnlyContactsSource<GooglePerson> {
  async processContact(
    context: ProcessContactContext,
    contact: GooglePerson,
    tx: TransactableDBType = db,
  ): Promise<void> {
    if (!contact.resourceName) {
      return;
    }

    const isDeleted = contact.metadata?.deleted === true;
    const contactId = `${contact.resourceName}_${context.platformContactListId}`;

    const contactData: DeletableContactData = {
      deleted: isDeleted,
      platformContactId: contactId,
      platformContactListId: context.platformContactListId,
      source: GOOGLE_PEOPLE,
    };

    if (!contactData.deleted) {
      const contactPhotoUrl = contact.photos?.find(
        (photo) => photo.default,
      )?.url;

      contactData.photoUrl = contactPhotoUrl ?? undefined;

      // Process email addresses
      if (contact.emailAddresses && contact.emailAddresses.length > 0) {
        contactData.emails = contact.emailAddresses
          .filter((email) => email.value)
          .map((email) => {
            if (!email.value) {
              throw new Error("Email has no value");
            }

            const emailType =
              checkEnum(email.type, GOOGLE_EMAIL_TYPE) ?? undefined;

            return {
              email: email.value,
              displayName: email.displayName ?? undefined,
              primary: email.metadata?.primary ?? undefined,
              platformData: emailType
                ? {
                    type: emailType,
                  }
                : undefined,
            };
          });
      }

      // Process names
      if (contact.names && contact.names.length > 0) {
        contactData.names = contact.names
          .filter((name) => name.displayName && name.givenName)
          .map((name) => ({
            // biome-ignore lint/style/noNonNullAssertion: Because of the filter above, we're guaranteed to have a given name
            givenName: name.givenName!,
            middleName: name.middleName ?? undefined,
            familyName: name.familyName ?? undefined,
            // biome-ignore lint/style/noNonNullAssertion: Because of the filter above, we're guaranteed to have a display name
            displayName: name.displayName!,
            primary: name.metadata?.primary ?? undefined,
          }));
      }
    }

    await processContactData(context, contactData, tx);
  }

  async syncContacts(accountId: string, contactListId: string): Promise<void> {
    return withGoogleAccount(accountId, GOOGLE_PEOPLE, async (googleAccount) =>
      db.transaction(async (tx) => {
        const [contactList] = await tx
          .select()
          .from(contactListTable)
          .where(
            and(
              eq(contactListTable.id, contactListId),
              eq(contactListTable.source, GOOGLE_PEOPLE),
            ),
          )
          .for("update");

        if (!contactList) {
          throw new Error("Contact list not found");
        }

        await syncContacts(
          googleAccount,
          contactList,
          async (contactList, contacts) => {
            for (const contact of contacts) {
              await this.processContact(
                {
                  userId: googleAccount.userId,
                  platformAccountId: accountId,
                  contactListId: contactList.id,
                  platformContactListId: contactList.platformContactListId,
                },
                contact,
                tx,
              );
            }
          },
          tx,
        );
      }),
    );
  }

  async fetchPlatformContact(
    integrationAccountId: string,
    platformContactId: string,
  ): Promise<GooglePerson> {
    return withGoogleAccount(
      integrationAccountId,
      GOOGLE_PEOPLE,
      async (googleAccount) => {
        const peopleClient = google.people({
          version: "v1",
          auth: googleAccount.oauth2Client,
        });
        const contact = await peopleClient.people.get({
          resourceName: platformContactId,
        });

        return contact.data;
      },
    );
  }
}
