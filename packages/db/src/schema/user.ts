import { OAUTH_SCOPES } from "@kokoro/validators/db";
import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const USER_ROLES = ["USER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),

  // Role stuff
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("USER"),
  accessToApi: boolean().notNull().default(false),

  // Payment stuff
  subscriptionId: text(),
  stripeCustomerId: text(),
  subscribedUntil: timestamp({ withTimezone: true }),

  // Onboarding stuff
  onboardingStep: integer().notNull().default(0),

  // Profile stuff
  alias: text(),
});

export const paymentTable = pgTable("payment", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  amount: integer().notNull(),
  timestamp: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const OAUTH_ACCOUNTS = ["GOOGLE"] as const;

export const accountTable = pgTable("account", {
  id: serial().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  platform: varchar({ length: 255, enum: OAUTH_ACCOUNTS }),
  platformId: text().notNull().unique(),
  profilePicture: text(),
});

export const sessionTable = pgTable("session", {
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp({
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
export type Account = InferSelectModel<typeof accountTable>;

//? OAUTH STUFF

export const oauthClientTable = pgTable("oauth_client", {
  id: uuid().defaultRandom().primaryKey(), // internal ID
  ownerId: uuid()
    .notNull()
    .references(() => userTable.id),
  name: text().notNull(), // display name
  clientId: text().notNull().unique(), // public client identifier
  clientSecret: text().notNull(), // secret for confidential clients
  redirectUris: text().array().notNull().default([]), // allowed callbacks
  scopes: text({ enum: OAUTH_SCOPES }).array().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const authCodeTable = pgTable("oauth_code", {
  code: text().primaryKey(), // one‑time use code
  clientId: uuid()
    .notNull()
    .references(() => oauthClientTable.id),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  redirectUri: text().notNull(),
  scope: text(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  codeChallenge: text(), // for PKCE
  codeChallengeMethod: text(),
});

export const tokenTable = pgTable("oauth_token", {
  accessToken: text().primaryKey(), // opaque or JWT
  refreshToken: text().unique(),
  clientId: uuid()
    .notNull()
    .references(() => oauthClientTable.id),
  userId: uuid().references(() => userTable.id), // may be null for client_credentials
  scope: text(),
  issuedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});
