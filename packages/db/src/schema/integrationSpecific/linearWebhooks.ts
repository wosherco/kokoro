import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const LINEAR_WEBHOOK_STATE = ["unknown", "active", "invalid"] as const;

export const linearWebhooksTable = pgTable("linear_webhooks", {
  id: uuid().primaryKey().defaultRandom(),
  workspaceId: text().notNull().unique(),
  // This is user input
  secret: text().notNull(),
  /**
   * This is used to track the state of the webhook.
   *
   * - unknown: The webhook has not been verified yet. (we haven't received anything, so we haven't checked)
   * - active: The webhook has worked once.
   * - invalid: The webhook is invalid. (we've received something, but it's not valid/not matching our secret)
   */
  state: varchar({ length: 255, enum: LINEAR_WEBHOOK_STATE })
    .notNull()
    .default("unknown"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
