import { and, eq, lower, notInArray } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import {
  contactEmailTable,
  contactLinkTable,
  contactListTable,
  contactNameTable,
  contactTable,
} from "@kokoro/db/schema";

import type { DeletableContactData, ProcessContactContext } from "./base";

export async function processContactData(
  context: ProcessContactContext,
  contactData: DeletableContactData,
  tx: TransactableDBType,
) {
  if (contactData.deleted) {
    await tx
      .delete(contactLinkTable)
      .where(
        and(
          eq(contactLinkTable.platformContactId, contactData.platformContactId),
          eq(
            contactLinkTable.platformContactListId,
            contactData.platformContactListId,
          ),
          eq(contactLinkTable.source, contactData.source),
          eq(contactLinkTable.userId, context.userId),
          eq(contactLinkTable.platformAccountId, context.platformAccountId),
        ),
      );

    return;
  }

  const [contactList] = await tx
    .select()
    .from(contactListTable)
    .where(
      and(
        eq(
          contactListTable.platformContactListId,
          contactData.platformContactListId,
        ),
        eq(contactListTable.userId, context.userId),
        eq(contactListTable.platformAccountId, context.platformAccountId),
        eq(contactListTable.source, contactData.source),
      ),
    );

  if (!contactList) {
    throw new Error("Contact list not found");
  }

  // Try to find an existing contact with the same external ID
  const existingContactRows = await tx
    .select()
    .from(contactTable)
    .innerJoin(
      contactLinkTable,
      eq(contactTable.id, contactLinkTable.contactId),
    )
    .leftJoin(
      contactEmailTable,
      eq(contactLinkTable.id, contactEmailTable.linkId),
    )
    .leftJoin(
      contactNameTable,
      eq(contactLinkTable.id, contactNameTable.linkId),
    )
    .where(
      and(
        eq(contactLinkTable.platformContactId, contactData.platformContactId),
        eq(
          contactLinkTable.platformContactListId,
          contactData.platformContactListId,
        ),
        eq(contactLinkTable.source, contactData.source),
        eq(contactLinkTable.userId, context.userId),
        eq(contactLinkTable.platformAccountId, context.platformAccountId),
      ),
    );

  const existingContact = existingContactRows[0];

  let basicContactDetails: {
    contactId: string;
    linkId: string;
  };

  if (!existingContact) {
    // Contact doesn't exist, create it
    const [createdContact] = await tx
      .insert(contactTable)
      .values({
        userId: context.userId,
      })
      .returning();

    if (!createdContact) {
      throw new Error("Failed to create contact");
    }

    const [createdContactLink] = await tx
      .insert(contactLinkTable)
      .values({
        userId: context.userId,
        contactId: createdContact.id,
        source: contactData.source,
        platformAccountId: context.platformAccountId,
        platformContactId: contactData.platformContactId,
        platformContactListId: contactData.platformContactListId,
        photoUrl: contactData.photoUrl,
        contactListId: contactList.id,
      })
      .returning();

    if (!createdContactLink) {
      throw new Error("Failed to create contact link");
    }

    basicContactDetails = {
      contactId: createdContact.id,
      linkId: createdContactLink.id,
    };
  } else {
    basicContactDetails = {
      contactId: existingContact.contact.id,
      linkId: existingContact.contact_link.id,
    };

    // Updating photo url if it exists and is different
    if (
      contactData.photoUrl !== existingContact.contact_link.photoUrl &&
      contactData.photoUrl !== undefined
    ) {
      await tx
        .update(contactLinkTable)
        .set({
          photoUrl: contactData.photoUrl,
        })
        .where(eq(contactLinkTable.id, basicContactDetails.linkId));
    }
  }

  const checkedEmails: string[] = [];

  // Process emails
  if (contactData.emails && contactData.emails.length > 0) {
    for (const email of contactData.emails) {
      const existingEmail = existingContactRows.find(
        (row) => row.contact_email?.email === email.email,
      );

      if (existingEmail?.contact_email) {
        checkedEmails.push(existingEmail.contact_email.id);

        if (email.primary !== existingEmail.contact_email.primary) {
          await tx
            .update(contactEmailTable)
            .set({
              primary: email.primary ?? undefined,
            })
            .where(eq(contactEmailTable.id, existingEmail.contact_email.id));
        }
      } else {
        // Check if this email exists in another contact
        const [anotherContactWithSameEmail] = await tx
          .select()
          .from(contactEmailTable)
          .innerJoin(
            contactLinkTable,
            eq(contactEmailTable.linkId, contactLinkTable.id),
          )
          .where(eq(lower(contactEmailTable.email), email.email.toLowerCase()));

        if (anotherContactWithSameEmail) {
          // Merge contacts
          const oldContactId = basicContactDetails.contactId;
          basicContactDetails.contactId =
            anotherContactWithSameEmail.contact_link.contactId;

          await tx
            .update(contactLinkTable)
            .set({
              contactId: anotherContactWithSameEmail.contact_link.contactId,
            })
            .where(eq(contactLinkTable.contactId, oldContactId));

          // Check for remaining links before deleting
          const remainingLinks = await tx
            .select()
            .from(contactLinkTable)
            .where(eq(contactLinkTable.contactId, oldContactId));

          if (remainingLinks.length === 0) {
            await tx
              .delete(contactTable)
              .where(eq(contactTable.id, oldContactId));
          }
        }

        // Create the email
        const [createdEmail] = await tx
          .insert(contactEmailTable)
          .values({
            userId: context.userId,
            linkId: basicContactDetails.linkId,
            email: email.email,
            displayName: email.displayName,
            primary: email.primary ?? undefined,
          })
          .returning({
            id: contactEmailTable.id,
          });

        if (!createdEmail) {
          throw new Error("Failed to create email");
        }

        checkedEmails.push(createdEmail.id);
      }
    }

    // Delete emails not in the list
    await tx
      .delete(contactEmailTable)
      .where(
        and(
          eq(contactEmailTable.linkId, basicContactDetails.linkId),
          notInArray(contactEmailTable.id, checkedEmails),
        ),
      );
  }

  // Process names
  const checkedNames: string[] = [];

  if (contactData.names && contactData.names.length > 0) {
    for (const name of contactData.names) {
      if (!name.displayName || !name.givenName) {
        continue;
      }

      const nameId = `${name.givenName}_${name.middleName}_${name.familyName}`;

      const existingName = existingContactRows.find(
        (row) => row.contact_name?.id === nameId,
      );

      if (existingName?.contact_name) {
        checkedNames.push(existingName.contact_name.id);

        if (name.primary !== existingName.contact_name.primary) {
          await tx
            .update(contactNameTable)
            .set({
              primary: name.primary ?? undefined,
            })
            .where(eq(contactNameTable.id, existingName.contact_name.id));
        }
      } else {
        // Create the name
        const [createdName] = await tx
          .insert(contactNameTable)
          .values({
            userId: context.userId,
            linkId: basicContactDetails.linkId,
            givenName: name.givenName,
            middleName: name.middleName,
            familyName: name.familyName,
            displayName: name.displayName,
            primary: name.primary ?? undefined,
          })
          .returning({
            id: contactNameTable.id,
          });

        if (!createdName) {
          throw new Error("Failed to create name");
        }

        checkedNames.push(createdName.id);
      }
    }

    // Delete names not in the list
    await tx
      .delete(contactNameTable)
      .where(
        and(
          eq(contactNameTable.linkId, basicContactDetails.linkId),
          notInArray(contactNameTable.id, checkedNames),
        ),
      );
  }

  return {
    contactId: basicContactDetails.contactId,
    linkId: basicContactDetails.linkId,
  };
}
