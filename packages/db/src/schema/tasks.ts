import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { TaskListConfig } from "@kokoro/validators/db";
import {
  EMPTY_TASK_LIST_CONFIG,
  TASK_SOURCES,
  TASK_STATES,
} from "@kokoro/validators/db";

import { integrationsAccountsTable } from "./integrations";
import { memoryTable } from "./memory";
import { userTable } from "./user";

export const tasklistsTable = pgTable(
  "tasklists",
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
    platformTaskListId: text().notNull(),
    source: varchar({
      length: 255,
      enum: TASK_SOURCES,
    }).notNull(),

    // Task list data
    name: text().notNull(),
    config: jsonb()
      .$type<TaskListConfig>()
      .notNull()
      .default(EMPTY_TASK_LIST_CONFIG),

    color: text(),
    colorOverride: text(),
    hidden: boolean().notNull().default(false),

    // Dates and others
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    lastSynced: timestamp({ withTimezone: true }),
  },
  (t) => ({
    userIdIdx: index().on(t.userId),
    platformUnique: unique().on(
      t.source,
      t.platformAccountId,
      t.platformTaskListId,
    ),
    platformWithUserIdUnique: unique().on(
      t.userId,
      t.source,
      t.platformAccountId,
      t.platformTaskListId,
    ),
  }),
);

export type Tasklist = InferSelectModel<typeof tasklistsTable>;

export interface SimpleTasklist {
  id: Tasklist["id"];
  userId: Tasklist["userId"];
  integrationAccountId: Tasklist["integrationAccountId"];
  platformAccountId: Tasklist["platformAccountId"];
  platformTaskListId: Tasklist["platformTaskListId"];
  source: Tasklist["source"];

  name: Tasklist["name"];
  config: Tasklist["config"];

  color: Tasklist["color"];
  hidden: Tasklist["hidden"];
}

export const memoryTaskTable = pgTable(
  "memory_tasks",
  {
    // ID stuff
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
      }),
    memoryId: uuid()
      .notNull()
      .references(() => memoryTable.id, {
        onDelete: "cascade",
      })
      .unique(),
    tasklistId: uuid()
      .notNull()
      .references(() => tasklistsTable.id, {
        onDelete: "cascade",
      }),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "cascade",
      }),
    platformAccountId: text().notNull(),
    platformTaskListId: text().notNull(),
    platformTaskId: text().notNull(),
    source: varchar({
      length: 255,
      enum: TASK_SOURCES,
    }).notNull(),

    // Task data
    dueDate: timestamp({ withTimezone: true }),

    // For recurrence (requires a dueDate)
    recurrence: text(),
    recurrenceEnd: timestamp({ withTimezone: true }),

    // Dates and others
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    userIdIdx: index().on(t.userId),
    memoryIdIdx: index().on(t.memoryId),
    tasklistIdIdx: index().on(t.tasklistId),
    platformUnique: unique().on(
      t.source,
      t.platformAccountId,
      t.platformTaskListId,
      t.platformTaskId,
    ),
    platformUserUnique: unique().on(
      t.userId,
      t.source,
      t.platformAccountId,
      t.platformTaskListId,
      t.platformTaskId,
    ),
  }),
);

export type MemoryTask = InferSelectModel<typeof memoryTaskTable>;

export const memoryTaskAttributeTable = pgTable(
  "memory_task_attributes",
  {
    // ID stuff
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    memoryTaskId: uuid()
      .notNull()
      .references(() => memoryTaskTable.id),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "cascade",
      }),
    platformAccountId: text().notNull(),
    platformTaskListId: text().notNull(),
    platformTaskId: text().notNull(),
    platformAttributeId: text().notNull(),
    source: varchar({
      length: 255,
      enum: TASK_SOURCES,
    }).notNull(),

    // Attribute data
    //? For kokoro brain
    state: varchar({
      length: 255,
      enum: TASK_STATES,
    }),
    priority: integer(),
    //* general
    platformValue: text(),

    // Dates and others
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    userIdIdx: index().on(t.userId),
    memoryTaskIdIdx: index().on(t.memoryTaskId),
    platformUnique: unique().on(
      t.source,
      t.platformAccountId,
      t.platformTaskListId,
      t.platformTaskId,
      t.platformAttributeId,
    ),
    memoryTaskIdPlatformAttributeIdUnique: unique().on(
      t.memoryTaskId,
      t.platformAttributeId,
    ),
  }),
);

export type MemoryTaskAttribute = InferSelectModel<
  typeof memoryTaskAttributeTable
>;

export interface SimpleMemoryTask {
  tasklistId: MemoryTask["tasklistId"];
  integrationAccountId: MemoryTask["integrationAccountId"];
  platformAccountId: MemoryTask["platformAccountId"];
  platformTaskListId: MemoryTask["platformTaskListId"];
  platformTaskId: MemoryTask["platformTaskId"];
  source: MemoryTask["source"];
  dueDate: MemoryTask["dueDate"];

  attributes: SimpleMemoryTaskAttribute[];
}

export type RecurringMemoryTask = SimpleMemoryTask & {
  recurrence: MemoryTask["recurrence"];
  recurrenceEnd: MemoryTask["recurrenceEnd"];
};

export interface SimpleMemoryTaskAttribute {
  platformAttributeId: MemoryTaskAttribute["platformAttributeId"];
  state: MemoryTaskAttribute["state"];
  priority: MemoryTaskAttribute["priority"];
  platformValue: MemoryTaskAttribute["platformValue"];
}
