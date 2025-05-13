import { GaxiosError } from "gaxios";
import type { people_v1 } from "googleapis";
import { google } from "googleapis";

import { eq } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import type { DBContactList } from "@kokoro/db/schema";
import { contactListTable } from "@kokoro/db/schema";

import type { GoogleAccount } from ".";

export type GooglePerson = people_v1.Schema$Person;

export async function syncContacts(
  googleAccount: GoogleAccount,
  contactList: DBContactList,
  processBatch: (
    contactList: DBContactList,
    entries: GooglePerson[],
  ) => Promise<void>,
  tx: TransactableDBType,
) {
  const { oauth2Client: googleClient, platformAccountId: accountId } =
    googleAccount;
  console.log(`[ACCOUNT ${accountId}] Starting contacts sync`);

  const people = google.people({ version: "v1", auth: googleClient });

  if (!contactList.platformData) {
    console.log(
      `[ACCOUNT ${accountId}] No type found for contact list ${contactList.platformContactListId}`,
    );
    return;
  }

  const type = contactList.platformData.endpoint;

  const recursiveSync = async (syncToken?: string, nextPageToken?: string) => {
    console.log(
      `[ACCOUNT ${accountId}] Fetching ${type} batch${
        nextPageToken ? " (continued)" : ""
      }`,
    );

    // biome-ignore lint/suspicious/noImplicitAnyLet: type is inferred after the try block
    let response;
    let connections: GooglePerson[] | undefined;

    try {
      switch (type) {
        case "connections":
          response = await people.people.connections.list({
            // Default is 100, max is 1000
            pageSize: 1000,
            requestSyncToken: true,
            syncToken,
            pageToken: nextPageToken,
            personFields:
              "metadata,birthdays,calendarUrls,emailAddresses,genders,locales,names,nicknames,organizations,photos,urls",
            resourceName: "people/me",
          });
          connections = response.data.connections;
          break;
        case "directory":
          try {
            response = await people.people.listDirectoryPeople({
              pageSize: 1000,
              requestSyncToken: true,
              syncToken,
              pageToken: nextPageToken,
              sources: [
                "DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT",
                "DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE",
              ],
              readMask:
                "metadata,birthdays,emailAddresses,genders,locales,names,nicknames,organizations,photos,urls",
            });
          } catch (error) {
            if (
              error instanceof GaxiosError &&
              error.message === "Must be a G Suite domain user."
            ) {
              // User is not in GSuite
              break;
            }
            throw error;
          }
          connections = response.data.people;
          break;
        case "otherContacts":
          response = await people.otherContacts.list({
            pageSize: 1000,
            requestSyncToken: true,
            syncToken,
            readMask:
              "metadata,birthdays,calendarUrls,emailAddresses,genders,locales,names,nicknames,organizations,photos,urls",
            sources: ["READ_SOURCE_TYPE_PROFILE", "READ_SOURCE_TYPE_CONTACT"],
          });
          connections = response.data.otherContacts;
          break;
      }
    } catch (error) {
      if (error instanceof GaxiosError && error.response?.status === 410) {
        console.log(
          `[ACCOUNT ${accountId}] Sync token expired, performing full sync`,
        );
        // equals to GONE, we need to re-sync the entire calendar list

        return recursiveSync();
      }

      throw error;
    }

    if (!connections) {
      console.log(`[ACCOUNT ${accountId}] No ${type} found in response`);
      return;
    }

    console.log(
      `[ACCOUNT ${accountId}] Processing ${connections.length} ${type}`,
    );

    await processBatch(contactList, connections);

    if (response?.data.nextPageToken) {
      console.log(
        `[ACCOUNT ${accountId}] More ${type} available, continuing sync`,
      );
      return recursiveSync(undefined, response.data.nextPageToken);
    }

    if (response?.data.nextSyncToken) {
      console.log(
        `[ACCOUNT ${accountId}] ${type} sync complete, updating sync token`,
      );
      await tx
        .update(contactListTable)
        .set({
          platformData: {
            endpoint: type,
            syncToken: response.data.nextSyncToken,
          },
          lastSyncedAt: new Date(),
        })
        .where(eq(contactListTable.id, contactList.id));

      return;
    }

    console.log(
      `[ACCOUNT ${accountId}] Error: No next sync token found for ${type}`,
    );
    throw new Error("No next sync token found");
  };

  return recursiveSync(contactList.platformData.syncToken);
}
