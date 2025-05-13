import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { GoogleContactType, GoogleEmailType } from "@kokoro/validators/db";
import { CONTACT_SOURCES } from "@kokoro/validators/db";

import { integrationsAccountsTable } from "./integrations";
import { userTable } from "./user";

interface GoogleContactListPlatformData {
  endpoint: GoogleContactType;
  syncToken?: string;
}

export const contactListTable = pgTable(
  "contact_list",
  {
    // ID stuff
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "cascade",
      }),
    platformAccountId: text().notNull(),
    platformContactListId: text().notNull(),
    source: varchar({ enum: CONTACT_SOURCES }).notNull(),

    // Data
    name: text().notNull(),
    platformData: jsonb().$type<GoogleContactListPlatformData>(),

    // Dates
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastSyncedAt: timestamp({ withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
    platformUnique: unique().on(
      table.platformAccountId,
      table.platformContactListId,
      table.source,
    ),
    userPlatformUnique: unique().on(
      table.userId,
      table.platformAccountId,
      table.platformContactListId,
      table.source,
    ),
  }),
);

export type DBContactList = InferSelectModel<typeof contactListTable>;

export const contactTable = pgTable("contact", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type DBContact = InferSelectModel<typeof contactTable>;

export const contactLinkTable = pgTable(
  "contact_link",
  {
    // ID stuff
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    contactId: uuid()
      .notNull()
      .references(() => contactTable.id),
    contactListId: uuid()
      .notNull()
      .references(() => contactListTable.id, {
        onDelete: "cascade",
      }),
    platformAccountId: text().notNull(),
    platformContactListId: text().notNull(),
    platformContactId: text().notNull(),
    source: varchar({ enum: CONTACT_SOURCES }).notNull(),

    // Data
    photoUrl: text(),

    // Dates
    addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index().on(table.userId),
    platformUnique: unique().on(
      table.platformAccountId,
      table.platformContactId,
      table.platformContactListId,
      table.source,
    ),
    userPlatformUnique: unique().on(
      table.userId,
      table.platformAccountId,
      table.platformContactId,
      table.platformContactListId,
      table.source,
    ),
  }),
);

export type DBContactLink = InferSelectModel<typeof contactLinkTable>;

export interface GoogleContactEmailPlatformData {
  type: GoogleEmailType;
}

export const contactEmailTable = pgTable("contact_email", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  linkId: uuid()
    .notNull()
    .references(() => contactLinkTable.id, {
      onDelete: "cascade",
    }),

  email: text().notNull(),
  displayName: text(),
  primary: boolean().notNull().default(false),
  platformData: jsonb().$type<GoogleContactEmailPlatformData>(),

  // Dates
  addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBContactEmail = InferSelectModel<typeof contactEmailTable>;

// ! Be careful. Some of these fields are indexed with a custom index. Check migration 0002. Fields are: givenName, middleName, familyName, displayName
export const contactNameTable = pgTable("contact_name", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  linkId: uuid()
    .notNull()
    .references(() => contactLinkTable.id, {
      onDelete: "cascade",
    }),
  givenName: text().notNull(),
  middleName: text(),
  familyName: text(),
  displayName: text().notNull(),
  primary: boolean().notNull().default(false),
  addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type DBContactName = InferSelectModel<typeof contactNameTable>;
