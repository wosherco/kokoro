import { diff, diffApplySequential, lookup } from "@kokoro/common/poldash";
import { and, eq } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db } from "@kokoro/db/client";
import { contactLinkTable, contactListTable } from "@kokoro/db/schema";
import type { LinearUser } from "@kokoro/linear";
import { withLinear } from "@kokoro/linear";
import { fetchLinearWorkspaceUsers } from "@kokoro/linear/people";
import { LINEAR } from "@kokoro/validators/db";

import type { DeletableContactData, ProcessContactContext } from "./base";
import { ReadOnlyContactsSource } from "./base";
import { processContactData } from "./common";

export class LinearContactsSource extends ReadOnlyContactsSource<LinearUser> {
  async processContact(
    context: ProcessContactContext,
    contact: LinearUser,
    tx: TransactableDBType = db,
  ): Promise<void> {
    await processContactData(
      context,
      {
        deleted: false,
        platformContactId: contact.id,
        platformContactListId: context.platformContactListId,
        source: LINEAR,
        photoUrl: contact.avatarUrl,
        emails: [
          {
            email: contact.email,
            displayName: contact.email,
            primary: true,
          },
        ],
        names: [
          {
            givenName: contact.name,
            displayName: contact.displayName,
            primary: true,
          },
        ],
      },
      tx,
    );
  }

  async syncContacts(accountId: string, contactListId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [contactList] = await tx
        .select()
        .from(contactListTable)
        .where(
          and(
            eq(contactListTable.id, contactListId),
            eq(contactListTable.source, LINEAR),
          ),
        )
        .for("update");

      if (!contactList) {
        throw new Error("Contact list not found");
      }

      const [workspaceUsers, existingContacts] = await Promise.all([
        withLinear(accountId, (linearAccount) =>
          fetchLinearWorkspaceUsers(linearAccount),
        ),
        tx
          .select()
          .from(contactLinkTable)
          .where(
            and(
              eq(contactLinkTable.contactListId, contactList.id),
              eq(contactLinkTable.source, LINEAR),
            ),
          ),
      ]);

      const workspaceUsersLookup = lookup(workspaceUsers, (user) => user.id);

      const formattedWorkspaceUsers = workspaceUsers.map(
        (user) =>
          ({
            platformContactId: user.id,
            source: LINEAR,
            platformContactListId: contactList.platformContactListId,
          }) as Omit<DeletableContactData, "deleted">,
      );

      const contactsDiff = diff(
        existingContacts,
        formattedWorkspaceUsers,
        "platformContactId",
      );

      const localProcess = (
        contact: (typeof formattedWorkspaceUsers)[number],
      ) => {
        const workspaceUser = workspaceUsersLookup(contact.platformContactId);

        if (!workspaceUser) {
          return;
        }

        return this.processContact(
          {
            userId: contactList.userId,
            platformAccountId: accountId,
            platformContactListId: contactList.platformContactListId,
            contactListId: contactList.id,
          },
          workspaceUser,
          tx,
        );
      };

      await diffApplySequential(contactsDiff, {
        onAdd: localProcess,
        onUpdate: localProcess,
        onRemove: async (contact) => {
          await processContactData(
            {
              userId: contactList.userId,
              platformAccountId: accountId,
              platformContactListId: contactList.platformContactListId,
              contactListId: contactList.id,
            },
            {
              ...contact,
              deleted: true,
            },
            tx,
          );
        },
      });
    });
  }

  async fetchPlatformContact(
    integrationAccountId: string,
    platformContactId: string,
  ): Promise<LinearUser> {
    return withLinear(integrationAccountId, async (linearAccount) => {
      const contact = await linearAccount.client.user(platformContactId);

      return contact;
    });
  }
}
