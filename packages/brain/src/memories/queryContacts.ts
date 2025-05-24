import { filterNil, groupBy } from "@kokoro/common/poldash";
import { and, desc, eq, lower, sql } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db as dbClient } from "@kokoro/db/client";
import type {
  DBContact,
  DBContactEmail,
  DBContactLink,
  DBContactName,
} from "@kokoro/db/schema";
import {
  contactEmailTable,
  contactLinkTable,
  contactNameTable,
  contactTable,
} from "@kokoro/db/schema";

export interface QueriedContact {
  id: DBContact["id"];
  links: {
    id: DBContactLink["id"];
    source: DBContactLink["source"];
    photoUrl: DBContactLink["photoUrl"];
    contactListId: DBContactLink["contactListId"];
    platformContactId: DBContactLink["platformContactId"];
    platformContactListId: DBContactLink["platformContactListId"];
    platformAccountId: DBContactLink["platformAccountId"];
  }[];
  emails: {
    id: DBContactEmail["id"];
    email: DBContactEmail["email"];
    displayName: DBContactEmail["displayName"];
    primary: DBContactEmail["primary"];
    linkId: DBContactEmail["linkId"];
  }[];
  names: {
    id: DBContactName["id"];
    givenName: DBContactName["givenName"];
    middleName: DBContactName["middleName"];
    familyName: DBContactName["familyName"];
    displayName: DBContactName["displayName"];
    primary: DBContactName["primary"];
    linkId: DBContactName["linkId"];
  }[];
}

// TODO: Make this type-safe
export async function queryContacts(
  userId: string,
  options:
    | {
        name: string;
      }
    | {
        email: string;
      },
  db: TransactableDBType = dbClient,
): Promise<QueriedContact[]> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let results: any[];

  if ("email" in options) {
    // For email queries, use Drizzle query builder
    results = await db
      .select({
        id: contactTable.id,
        link: {
          id: contactLinkTable.id,
          source: contactLinkTable.source,
          photoUrl: contactLinkTable.photoUrl,
          contactListId: contactLinkTable.contactListId,
          platformContactId: contactLinkTable.platformContactId,
          platformContactListId: contactLinkTable.platformContactListId,
          platformAccountId: contactLinkTable.platformAccountId,
        },
        email: {
          id: contactEmailTable.id,
          email: contactEmailTable.email,
          displayName: contactEmailTable.displayName,
          primary: contactEmailTable.primary,
          linkId: contactEmailTable.linkId,
        },
        name: {
          id: contactNameTable.id,
          givenName: contactNameTable.givenName,
          middleName: contactNameTable.middleName,
          familyName: contactNameTable.familyName,
          displayName: contactNameTable.displayName,
          primary: contactNameTable.primary,
          linkId: contactNameTable.linkId,
        },
      })
      .from(contactTable)
      .leftJoin(
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
          eq(contactTable.userId, userId),
          eq(lower(contactEmailTable.email), options.email.toLowerCase()),
        ),
      )
      .orderBy(desc(contactNameTable.primary));
  } else {
    // For name queries, use raw SQL
    const queryString = sql`
      WITH contact_matches AS (
        SELECT
          c.id,
          cl.id as link_id,
          cl.type as link_type,
          cl.source as link_source,
          cl.photo_url,
          cl.external_source_id,
          cl.external_google_contact_list_id,
          ce.id as email_id,
          ce.email,
          ce.email_type,
          ce.display_name as email_display_name,
          ce.primary as email_primary,
          ce.link_id as email_link_id,
          cn.id as name_id,
          cn.given_name,
          cn.middle_name,
          cn.family_name,
          cn.display_name as name_display_name,
          cn.primary as name_primary,
          cn.link_id as name_link_id,
          gad.email as google_email,
          gad.google_account_id,
          GREATEST(
            similarity(lower(unaccent_string(cn.given_name)), lower(unaccent_string(${options.name}))),
            similarity(lower(unaccent_string(cn.family_name)), lower(unaccent_string(${options.name}))),
            similarity(lower(unaccent_string(cn.display_name)), lower(unaccent_string(${options.name}))),
            similarity(
              lower(unaccent_string(
                COALESCE(cn.given_name, '') || ' ' ||
                COALESCE(cn.middle_name, '') || ' ' ||
                COALESCE(cn.family_name, '')
              )),
              lower(unaccent_string(${options.name}))
            )
          ) as match_score
        FROM contact c
        LEFT JOIN contact_link cl ON c.id = cl.contact_id
        LEFT JOIN contact_email ce ON cl.id = ce.link_id
        LEFT JOIN contact_name cn ON cl.id = cn.link_id
        LEFT JOIN external_google_contacts_list egcl ON cl.external_google_contact_list_id = egcl.id
        LEFT JOIN google_account_details gad ON egcl.google_account_details = gad.id
        WHERE c.user_id = ${userId}
          AND (
            -- Similarity matches
            similarity(lower(unaccent_string(cn.given_name)), lower(unaccent_string(${options.name}))) > 0.3 OR
            similarity(lower(unaccent_string(cn.family_name)), lower(unaccent_string(${options.name}))) > 0.3 OR
            similarity(lower(unaccent_string(cn.display_name)), lower(unaccent_string(${options.name}))) > 0.3 OR
            similarity(
              lower(unaccent_string(
                COALESCE(cn.given_name, '') || ' ' ||
                COALESCE(cn.middle_name, '') || ' ' ||
                COALESCE(cn.family_name, '')
              )),
              lower(unaccent_string(${options.name}))
            ) > 0.3 OR
            -- Levenshtein matches
            levenshtein(lower(unaccent_string(cn.given_name)), lower(unaccent_string(${options.name}))) <= 3 OR
            levenshtein(lower(unaccent_string(cn.family_name)), lower(unaccent_string(${options.name}))) <= 3 OR
            levenshtein(lower(unaccent_string(cn.display_name)), lower(unaccent_string(${options.name}))) <= 3 OR
            -- Metaphone matches
            metaphone(lower(unaccent_string(cn.given_name)), 10) = metaphone(lower(unaccent_string(${options.name})), 10) OR
            metaphone(lower(unaccent_string(cn.family_name)), 10) = metaphone(lower(unaccent_string(${options.name})), 10)
          )
      )
      SELECT *
      FROM contact_matches
      ORDER BY name_primary DESC, match_score DESC
      LIMIT 5;
    `;

    results = await db.execute(queryString);
  }

  // Process results
  const isNameQuery = "name" in options;
  const grouped = groupBy(results, (result) => String(result.id));

  return filterNil(
    Object.values(grouped).map((groupResults) => {
      const first = groupResults[0];
      if (!first) return undefined;

      const contact: QueriedContact = {
        id: first.id,
        links: [],
        emails: [],
        names: [],
      };

      // Process all results in the group
      for (const result of groupResults) {
        // Process links
        if (isNameQuery) {
          // Raw SQL result (name query)
          if (result.link_id) {
            contact.links.push({
              id: result.link_id,
              source: result.link_source,
              photoUrl: result.photo_url,
              contactListId: result.contact_list_id,
              platformContactId: result.platform_contact_id,
              platformContactListId: result.platform_contact_list_id,
              platformAccountId: result.platform_account_id,
            });
          }

          // Process emails
          if (result.email_id) {
            contact.emails.push({
              id: result.email_id,
              email: result.email,
              displayName: result.email_display_name,
              primary: result.email_primary,
              linkId: result.email_link_id,
            });
          }

          // Process names
          if (result.name_id) {
            contact.names.push({
              id: result.name_id,
              givenName: result.given_name,
              middleName: result.middle_name,
              familyName: result.family_name,
              displayName: result.name_display_name,
              primary: result.name_primary,
              linkId: result.name_link_id,
            });
          }
        } else {
          // Drizzle result (email query)
          if (result.link?.id) {
            contact.links.push({
              ...result.link,
            });
          }

          if (result.email?.id) {
            contact.emails.push(result.email);
          }

          if (result.name?.id) {
            contact.names.push(result.name);
          }
        }
      }

      return contact;
    }),
  );
}
