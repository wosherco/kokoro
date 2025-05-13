import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { userTable } from "./user";

export const chatTable = pgTable("chat", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const chatFeedbackTable = pgTable("chat_feedback", {
  id: uuid().primaryKey().defaultRandom(),
  chatId: uuid().references(() => chatTable.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  value: integer().notNull(),
  feedback: text(),
  resolved: boolean().notNull().default(false),
});
