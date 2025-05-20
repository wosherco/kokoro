import { sql, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

import type { GoogleCalendarEventPlatformData } from "@kokoro/validators/db";
import {
  CALENDAR_SOURCES,
  GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
  GOOGLE_CALENDAR_EVENT_TYPES,
} from "@kokoro/validators/db";

import { calendarTable } from "./calendars";
import { chatTable } from "./chat";
import { integrationsAccountsTable } from "./integrations";
import { userTable } from "./user";

export const MEMORY_SOURCES = [
  "INTERACTION",
  "PAST_CONVERSATION",
  "CALENDAR",
  "TASK",
] as const;

export type MemorySource = (typeof MEMORY_SOURCES)[number];

export const memoryTable = pgTable(
  "memory",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),
    content: text().notNull(),
    contentEmbedding: vector({ dimensions: 384 }),
    description: text(),
    descriptionEmbedding: vector({ dimensions: 384 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastUpdate: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),

    /**
     * @deprecated TO BE REMOVED. IT'S USELESS
     */
    source: varchar({ length: 255, enum: MEMORY_SOURCES }).notNull(),

    // Relations
    interactionSource: uuid().references(() => chatTable.id),
  },
  (t) => ({
    contentEmbeddingIdx: index().using(
      "hnsw",
      t.contentEmbedding.op("vector_cosine_ops")
    ),
    descriptionEmbeddingIdx: index().using(
      "hnsw",
      t.descriptionEmbedding.op("vector_cosine_ops")
    ),
    //! FTS FUNCTIONS ARE ON migration 0023. If modifying this code/schema,
    //! make sure to update the migration if needed.
    // TODO: Support other languages?
    contentFTS: index("content_fts").using(
      "gin",
      sql`to_tsvector('english', ${t.content})`
    ),
    // TODO: Support other languages?
    descriptionFTS: index("description_fts").using(
      "gin",
      sql`to_tsvector('english', ${t.description})`
    ),
  })
);

export type Memory = InferSelectModel<typeof memoryTable>;

export interface SimpleMemory {
  id: Memory["id"];
  content: Memory["content"];
  description: Memory["description"];
  source: Memory["source"];
  lastUpdate: Memory["lastUpdate"];
}

export const memoryEventTable = pgTable(
  "memory_event",
  {
    // IDs
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
    icalUid: text().notNull(),
    integrationAccountId: uuid()
      .notNull()
      .references(() => integrationsAccountsTable.id, {
        onDelete: "cascade",
      }),
    platformId: text().notNull(),
    platformAccountId: text().notNull(),
    platformCalendarId: text().notNull(),
    calendarId: uuid()
      .notNull()
      .references(() => calendarTable.id, {
        onDelete: "cascade",
      }),
    source: varchar({ length: 255, enum: CALENDAR_SOURCES }).notNull(),
    sequence: integer().notNull(),

    // Actual Data
    startDate: timestamp({ withTimezone: true }).notNull(),
    startDateTimeZone: text(),
    endDate: timestamp({ withTimezone: true }).notNull(),
    endDateTimeZone: text(),
    isFullDay: boolean().notNull().default(false),
    attendenceStatus: varchar({
      length: 255,
      enum: GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
    }).notNull(),
    isOrganizer: boolean().notNull().default(false),
    organizerEmail: text(),
    isCreator: boolean().notNull().default(true),
    creatorEmail: text(),
    eventType: varchar({
      length: 255,
      enum: GOOGLE_CALENDAR_EVENT_TYPES,
    }).notNull(),
    platformData: jsonb().$type<GoogleCalendarEventPlatformData>(),

    // TODO: Add transparency and visibility?
    /**
     * Whether the event blocks time on the calendar. Optional. Possible values are:
     * - "opaque" - Default value. The event does block time on the calendar. This is equivalent to setting Show me as to Busy in the Calendar UI.
     * - "transparent" - The event does not block time on the calendar. This is equivalent to setting Show me as to Available in the Calendar UI.
     */
    // transparency: varchar({
    //   length: 255,
    //   enum: GOOGLE_CALENDAR_EVENT_TRANSPARENCY,
    // }),
    // visibility: varchar({
    //   length: 255,
    //   enum: GOOGLE_CALENDAR_EVENT_VISIBILITY,
    // }).notNull(),

    // For recurring events
    rrule: text(),
    recurringEnd: timestamp({ withTimezone: true }),

    // For recurring instance events
    recurringEventPlatformId: text(),
    startOriginal: timestamp({ withTimezone: true }),
    startOriginalTimeZone: text(),
    deletedInstance: boolean().notNull().default(false),

    // Times and others
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    conflictResolved: boolean().notNull().default(false),
  },
  (t) => ({
    // recurringEventReference: foreignKey({
    //   columns: [
    //     t.recurringEventPlatformId,
    //     t.recurringEventPlatformCalendarId,
    //     t.platformAccountId,
    //   ],
    //   foreignColumns: [t.platformId, t.platformCalendarId, t.platformAccountId],
    // }).onDelete("cascade"),
    platformAccountIdPlatformIdPlatformCalendarIdUnique: unique().on(
      t.source,
      t.platformAccountId,
      t.platformId,
      t.platformCalendarId
    ),
  })
);

export type MemoryEvent = InferSelectModel<typeof memoryEventTable>;

export interface SimpleMemoryEvent {
  // IDs
  icalUid: MemoryEvent["icalUid"];
  integrationAccountId: MemoryEvent["integrationAccountId"];
  platformId: MemoryEvent["platformId"];
  platformCalendarId: MemoryEvent["platformCalendarId"];
  platformAccountId: MemoryEvent["platformAccountId"];
  calendarId: MemoryEvent["calendarId"];
  source: MemoryEvent["source"];
  sequence: MemoryEvent["sequence"];

  // Actual Data
  startDate: MemoryEvent["startDate"];
  startDateTimeZone: MemoryEvent["startDateTimeZone"];
  endDate: MemoryEvent["endDate"];
  endDateTimeZone: MemoryEvent["endDateTimeZone"];
  isFullDay: MemoryEvent["isFullDay"];
  attendenceStatus: MemoryEvent["attendenceStatus"];
  isOrganizer: MemoryEvent["isOrganizer"];
  organizerEmail: MemoryEvent["organizerEmail"];
  isCreator: MemoryEvent["isCreator"];
  creatorEmail: MemoryEvent["creatorEmail"];
  eventType: MemoryEvent["eventType"];
  platformData: MemoryEvent["platformData"];

  attendees?: SimpleMemoryEventAttendant[];
  attendeesOmitted?: boolean;
}

export type RecurringMemoryEvent = SimpleMemoryEvent & {
  rrule: MemoryEvent["rrule"];
  recurringEnd: MemoryEvent["recurringEnd"];
};

export type RecurringInstanceMemoryEvent = SimpleMemoryEvent & {
  recurringEventPlatformId: MemoryEvent["recurringEventPlatformId"];
  startOriginal: MemoryEvent["startOriginal"];
  startOriginalTimeZone: MemoryEvent["startOriginalTimeZone"];
  deletedInstance: MemoryEvent["deletedInstance"];
};

export const memoryEventAttendantsTable = pgTable(
  "memory_event_attendants",
  {
    id: uuid().primaryKey().defaultRandom(),
    memoryEventId: uuid()
      .notNull()
      .references(() => memoryEventTable.id, {
        onDelete: "cascade",
      }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, {
        onDelete: "cascade",
      }),
    displayName: text(),
    email: text().notNull(),
    comment: text(),
    platformAttendeeId: text(),
    optional: boolean().notNull().default(false),
    organizer: boolean().notNull().default(false),
    status: varchar({
      length: 255,
      enum: GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
    }),
    self: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastUpdated: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    userIdIdx: index().on(t.userId),
    memoryEventIdIdx: index().on(t.memoryEventId),
    memoryEventIdEmailUnique: unique().on(t.memoryEventId, t.email),
  })
);

export type MemoryEventAttendant = InferSelectModel<
  typeof memoryEventAttendantsTable
>;

export type SimpleMemoryEventAttendant = Pick<
  MemoryEventAttendant,
  | "displayName"
  | "email"
  | "comment"
  | "platformAttendeeId"
  | "optional"
  | "organizer"
  | "status"
  | "self"
>;
