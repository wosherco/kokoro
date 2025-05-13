import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { IntegrationPlatformData } from "@kokoro/validators/db";
import { INTEGRATIONS } from "@kokoro/validators/db";

import { userTable } from "./user";

export const integrationsAccountsTable = pgTable(
  "integrations_accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    integrationType: varchar({
      length: 255,
      enum: INTEGRATIONS,
    }).notNull(),
    platformAccountId: text().notNull(),
    email: text().notNull(),
    profilePicture: text(),
    platformDisplayName: text().notNull(),
    platformData: jsonb().$type<IntegrationPlatformData>(),
    accessToken: text().notNull(),
    refreshToken: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    invalidGrant: boolean().notNull().default(false),
  },
  (t) => ({
    platformAccountIdIntegrationTypeUnique: unique().on(
      t.platformAccountId,
      t.integrationType,
    ),
    emailIntegrationTypeUnique: unique().on(t.email, t.integrationType),
  }),
);
