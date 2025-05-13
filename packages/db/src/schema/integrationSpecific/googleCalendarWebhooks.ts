import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { integrationsAccountsTable } from "../integrations";
import { userTable } from "../user";

export const externalGoogleCalendarListWatchersTable = pgTable(
  "external_google_calendarlist_watchers",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "restrict",
      })
      .unique(),
    secret: text().notNull(),
    resourceId: text(),
    expiryDate: timestamp({ withTimezone: true }).notNull(),
  },
);

export const externalGoogleCalendarEventsWatchersTable = pgTable(
  "external_google_calendar_events_watchers",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "restrict",
      }),
    calendarId: text().notNull(),
    secret: text().notNull(),
    resourceId: text(),
    expiryDate: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => ({
    integrationAccountIdCalendarIdUnique: unique().on(
      t.integrationAccountId,
      t.calendarId,
    ),
  }),
);
