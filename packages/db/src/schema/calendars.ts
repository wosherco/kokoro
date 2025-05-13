import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  json,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { GoogleCalendarPlatformData } from "@kokoro/validators/db";
import { CALENDAR_SOURCES } from "@kokoro/validators/db";

import { integrationsAccountsTable } from "./integrations";
import { userTable } from "./user";

export const calendarTable = pgTable(
  "calendar",
  {
    // ID stuff
    id: uuid().primaryKey().defaultRandom(),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "cascade",
      }),
    platformCalendarId: text().notNull(),
    platformAccountId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),

    // Calendar details
    summary: text(),
    summaryOverride: text(),
    description: text(),
    color: text(),
    colorOverride: text(),
    timeZone: text(),
    hidden: boolean().notNull().default(false),

    platformData: jsonb().$type<GoogleCalendarPlatformData>(),

    // Syncing
    eventsSyncToken: text(),
    lastSynced: timestamp({ withTimezone: true }),

    // Source and others
    source: varchar({ length: 255, enum: CALENDAR_SOURCES }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastUpdate: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    userIdIdx: index().on(t.userId),
    platformAccountIdPlatformCalendarIdUnique: unique().on(
      t.platformAccountId,
      t.platformCalendarId,
      t.source,
    ),
  }),
);

export type DBCalendar = InferSelectModel<typeof calendarTable>;
