import {
  diff,
  diffApply,
  diffApplyIndividual,
  filterNil,
  filterNull,
  groupBy,
} from "@kokoro/common/poldash";
import type { SQLWrapper } from "@kokoro/db";
import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lower,
  lte,
  not,
  or,
  sql,
} from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db as dbClient } from "@kokoro/db/client";
import type {
  DBCalendar,
  DBContact,
  DBContactEmail,
  DBContactLink,
  DBContactName,
  MemoryEvent,
  MemorySource,
  MemoryTask,
  MemoryTaskAttribute,
  RecurringInstanceMemoryEvent,
  RecurringMemoryEvent,
  RecurringMemoryTask,
  SimpleMemoryEvent,
  SimpleMemoryEventAttendant,
  SimpleMemoryTask,
  SimpleMemoryTaskAttribute,
  Tasklist,
} from "@kokoro/db/schema";
import {
  calendarTable,
  contactEmailTable,
  contactLinkTable,
  contactNameTable,
  contactTable,
  memoryEventAttendantsTable,
  memoryEventTable,
  memoryTable,
  memoryTaskAttributeTable,
  memoryTaskTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import { processRrule } from "@kokoro/rrule";
import {
  type CalendarSource,
  EVENT_MEMORY_TYPE,
  type MemorySortBy,
  type MemoryType,
  type OrderBy,
  TASK_MEMORY_TYPE,
  type TaskSource,
  type TaskState,
} from "@kokoro/validators/db";

import { getEmbedding } from "./embeddings";

export { getEmbedding };

interface UpsertMemoryOptions {
  source: MemorySource;
  content: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  /**
   * Only provide if updating an existing memory
   */
  memoryId?: string;
  relations?: {
    interactionId?: string;
  };
  /**
   * You can just provide event or task, not both
   */
  event?:
    | SimpleMemoryEvent
    | RecurringMemoryEvent
    | RecurringInstanceMemoryEvent;
  /**
   * You can just provide event or task, not both
   */
  task?: SimpleMemoryTask | RecurringMemoryTask;
  embeddings?: boolean;
}

export async function upsertMemory(
  userId: string,
  options: UpsertMemoryOptions,
  db: TransactableDBType = dbClient,
) {
  const {
    content,
    description,
    source,
    memoryId,
    relations,
    createdAt,
    updatedAt,
    event,
    task,
    embeddings = true,
  } = options;

  if (event && task) {
    throw new Error("You can only provide one of event or task");
  }

  const [contentEmbedding, descriptionEmbedding] = await Promise.all([
    embeddings ? getEmbedding(content) : null,
    embeddings && description ? getEmbedding(description) : null,
  ]);

  const values = {
    content,
    contentEmbedding,
    description,
    descriptionEmbedding,
    source,
    createdAt,
    updatedAt,
  };

  const updateMemoryEvent = async (memoryId: string) => {
    if (!event) {
      return {};
    }

    const [memoryEvent] = await db
      .insert(memoryEventTable)
      .values({
        ...event,
        userId,
        memoryId,
      })
      .onConflictDoUpdate({
        target: [memoryEventTable.memoryId],
        set: {
          ...event,
          userId,
          memoryId,
        },
      })
      .returning({
        memoryEventId: memoryEventTable.id,
      });

    if (event.attendees && memoryEvent) {
      // Get existing attendees
      const existingAttendees = await db
        .select()
        .from(memoryEventAttendantsTable)
        .where(
          eq(
            memoryEventAttendantsTable.memoryEventId,
            memoryEvent.memoryEventId,
          ),
        );

      const attendeesDiff = diff(
        existingAttendees as SimpleMemoryEventAttendant[],
        event.attendees,
        "email",
        (existing, attendee) =>
          existing.comment !== attendee.comment ||
          existing.displayName !== attendee.displayName ||
          existing.optional !== attendee.optional ||
          existing.organizer !== attendee.organizer ||
          existing.status !== attendee.status ||
          existing.self !== attendee.self,
      );

      await diffApply(attendeesDiff, {
        async onRemove(items) {
          await db.delete(memoryEventAttendantsTable).where(
            and(
              eq(
                memoryEventAttendantsTable.memoryEventId,
                memoryEvent.memoryEventId,
              ),
              inArray(
                memoryEventAttendantsTable.email,
                items.map((item) => item.email),
              ),
            ),
          );
        },
        async onAdd(items) {
          await db.insert(memoryEventAttendantsTable).values(
            items.map((item) => ({
              ...item,
              id: undefined,
              userId,
              memoryEventId: memoryEvent.memoryEventId,
            })),
          );
        },
      });

      await diffApplyIndividual(attendeesDiff, {
        async onUpdate(item) {
          await db
            .update(memoryEventAttendantsTable)
            .set({
              ...item,
              id: undefined,
            })
            .where(
              and(
                eq(
                  memoryEventAttendantsTable.memoryEventId,
                  memoryEvent.memoryEventId,
                ),
                eq(memoryEventAttendantsTable.email, item.email),
              ),
            );
        },
      });
    }

    return memoryEvent ?? {};
  };

  const updateMemoryTask = async (memoryId: string) => {
    if (!task) {
      return {};
    }

    const [memoryTask] = await db
      .insert(memoryTaskTable)
      .values({ ...task, userId, memoryId })
      .onConflictDoUpdate({
        target: [
          memoryTaskTable.source,
          memoryTaskTable.platformTaskId,
          memoryTaskTable.platformTaskListId,
          memoryTaskTable.platformAccountId,
          memoryTaskTable.userId,
        ],
        set: { ...task, userId, memoryId },
      })
      .returning({
        id: memoryTaskTable.id,
        integrationAccountId: memoryTaskTable.integrationAccountId,
        platformTaskId: memoryTaskTable.platformTaskId,
        platformTaskListId: memoryTaskTable.platformTaskListId,
        platformAccountId: memoryTaskTable.platformAccountId,
        tasklistId: memoryTaskTable.tasklistId,
        source: memoryTaskTable.source,
      });

    if (memoryTask) {
      const currentAttributes = await db
        .select()
        .from(memoryTaskAttributeTable)
        .where(eq(memoryTaskAttributeTable.memoryTaskId, memoryTask.id));

      const attributesDiff = diff(
        currentAttributes as SimpleMemoryTaskAttribute[],
        task.attributes,
        "platformAttributeId",
        (existing, attribute) =>
          existing.state !== attribute.state ||
          existing.priority !== attribute.priority ||
          existing.platformValue !== attribute.platformValue,
      );

      await diffApply(attributesDiff, {
        async onRemove(items) {
          await db.delete(memoryTaskAttributeTable).where(
            and(
              eq(memoryTaskAttributeTable.memoryTaskId, memoryTask.id),
              inArray(
                memoryTaskAttributeTable.platformAttributeId,
                items.map((item) => item.platformAttributeId),
              ),
            ),
          );
        },
        async onAdd(items) {
          await db.insert(memoryTaskAttributeTable).values(
            items.map((item) => ({
              ...item,
              userId,
              memoryTaskId: memoryTask.id,
              integrationAccountId: memoryTask.integrationAccountId,
              platformAccountId: memoryTask.platformAccountId,
              platformTaskListId: memoryTask.platformTaskListId,
              platformTaskId: memoryTask.platformTaskId,
              tasklistId: memoryTask.tasklistId,
              source: memoryTask.source,
            })),
          );
        },
      });

      await diffApplyIndividual(attributesDiff, {
        async onUpdate(item) {
          await db
            .update(memoryTaskAttributeTable)
            .set({
              ...item,
              platformAttributeId: undefined,
            })
            .where(
              and(
                eq(memoryTaskAttributeTable.memoryTaskId, memoryTask.id),
                eq(
                  memoryTaskAttributeTable.platformAttributeId,
                  item.platformAttributeId,
                ),
              ),
            );
        },
      });
    }

    return memoryTask?.id ? { memoryTaskId: memoryTask.id } : {};
  };

  const handleUpdates = async (
    memoryId: string,
  ): Promise<{ memoryEventId?: string; memoryTaskId?: string }> => {
    const newIds = await Promise.all([
      updateMemoryEvent(memoryId),
      updateMemoryTask(memoryId),
    ]);

    return newIds.reduce((acc, curr) => {
      return {
        // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
        ...acc,
        ...curr,
      };
    }, {});
  };

  if (memoryId !== undefined) {
    const [updatedMemory] = await db
      .update(memoryTable)
      .set({
        ...values,
      })
      .where(and(eq(memoryTable.id, memoryId), eq(memoryTable.userId, userId)))
      .returning({
        id: memoryTable.id,
      });

    if (!updatedMemory) {
      throw new Error("Failed to update memory");
    }

    const updatesData = await handleUpdates(updatedMemory.id);

    return {
      ...updatedMemory,
      ...updatesData,
    };
  }

  const [memory] = await db
    .insert(memoryTable)
    .values({
      userId,
      ...values,
      ...relations,
    })
    .returning({
      id: memoryTable.id,
    });

  if (!memory) {
    throw new Error("Failed to create memory");
  }

  const updatesData = await handleUpdates(memory.id);

  return {
    ...memory,
    ...updatesData,
  };
}

function processTaskAttributes<
  T extends { taskAttributes: MemoryTaskAttribute | null },
>(
  memory: T[],
):
  | (Omit<T, "taskAttributes"> & { taskAttributes: MemoryTaskAttribute[] })
  | null {
  const firstMemory = memory[0];

  if (!firstMemory) {
    return null;
  }

  const attributes = filterNull(memory.flatMap((m) => m.taskAttributes));

  return {
    ...firstMemory,
    taskAttributes: attributes,
  };
}

export async function getMemories(
  userId: string,
  ids: string[],
  db: TransactableDBType = dbClient,
): Promise<QueriedMemory[]> {
  const rows = await db
    .select({
      id: memoryTable.id,
      content: memoryTable.content,
      description: memoryTable.description,
      createdAt: memoryTable.createdAt,
      source: memoryTable.source,
      lastUpdate: memoryTable.lastUpdate,
      event: memoryEventTable,
      calendar: calendarTable,
      task: memoryTaskTable,
      tasklist: tasklistsTable,
      taskAttributes: memoryTaskAttributeTable,
      isVirtual: sql<boolean>`FALSE`,
    })
    .from(memoryTable)
    .leftJoin(memoryEventTable, eq(memoryTable.id, memoryEventTable.memoryId))
    .leftJoin(calendarTable, eq(memoryEventTable.calendarId, calendarTable.id))
    .leftJoin(memoryTaskTable, eq(memoryTable.id, memoryTaskTable.memoryId))
    .leftJoin(tasklistsTable, eq(memoryTaskTable.tasklistId, tasklistsTable.id))
    .leftJoin(
      memoryTaskAttributeTable,
      eq(memoryTaskTable.id, memoryTaskAttributeTable.memoryTaskId),
    )
    .where(and(inArray(memoryTable.id, ids), eq(memoryTable.userId, userId)));

  const groupedMemories = groupBy(rows, "id");

  return filterNull(Object.values(groupedMemories).map(processTaskAttributes));
}

export async function queryMemories(
  userId: string,
  options: {
    // Filter by content
    contentQuery?: string;
    descriptionQuery?: string;

    // Filter by date
    startDate?: Date;
    endDate?: Date;

    // Filter by memory type
    memoryTypes?: Set<MemoryType>;

    // Filter by integration
    integrationAccountIds?: string[];
    calendarIds?: string[];
    tasklistIds?: string[];

    // Filter by calendar
    calendarSources?: Set<CalendarSource>;

    // Filter by task
    taskSources?: Set<TaskSource>;
    taskStates?: Set<TaskState>;

    // Sort by
    /**
     * @default "similarity"
     */
    sortBy?: MemorySortBy;
    /**
     * @default "desc"
     */
    orderBy?: OrderBy;

    /**
     * @deprecated this is useless
     */
    source?: MemorySource | Set<MemorySource>;
  },
  db: TransactableDBType = dbClient,
): Promise<QueriedMemory[]> {
  const {
    startDate,
    endDate,
    integrationAccountIds,
    calendarIds,
    tasklistIds,
    calendarSources,
    taskSources,
    taskStates,
    sortBy = "similarity",
    orderBy = "desc",
  } = options;

  const [contentEmbedding, descriptionEmbedding] = await Promise.all([
    options.contentQuery?.trim()
      ? getEmbedding(options.contentQuery)
      : undefined,
    options.descriptionQuery?.trim()
      ? getEmbedding(options.descriptionQuery)
      : undefined,
  ]);

  let sourceCondition = sql`TRUE`;

  if (options.source !== undefined) {
    sourceCondition = inArray(
      memoryTable.source,
      options.source instanceof Set
        ? Array.from(options.source)
        : [options.source],
    );
  }

  const baseFilters = [
    eq(memoryTable.userId, userId),
    sourceCondition,
    contentEmbedding ? sql<boolean>`${memoryTable.content} <> ''` : undefined,
    descriptionEmbedding
      ? sql<boolean>`${memoryTable.description} <> ''`
      : undefined,
  ];

  const shouldIncludeMemoryType = (type: MemoryType) =>
    options.memoryTypes && options.memoryTypes.size > 0
      ? options.memoryTypes.has(type)
      : true;

  const memoryEvents = shouldIncludeMemoryType(EVENT_MEMORY_TYPE)
    ? await queryMemoryEvents(
        [
          isNotNull(memoryEventTable.id),
          ...baseFilters,
          calendarSources
            ? inArray(memoryEventTable.source, Array.from(calendarSources))
            : undefined,
          integrationAccountIds
            ? inArray(
                memoryEventTable.integrationAccountId,
                integrationAccountIds,
              )
            : undefined,
          calendarIds
            ? inArray(memoryEventTable.calendarId, calendarIds)
            : undefined,
        ],
        {
          contentEmbedding,
          descriptionEmbedding,
          startDate,
          endDate,
          sortBy,
          orderBy,
        },
        db,
      )
    : [];

  const memoryTasks = shouldIncludeMemoryType(TASK_MEMORY_TYPE)
    ? await queryMemoryTasks(
        [
          isNotNull(memoryTaskTable.id),
          ...baseFilters,
          taskSources
            ? inArray(memoryTaskTable.source, Array.from(taskSources))
            : undefined,
          integrationAccountIds
            ? inArray(
                memoryTaskTable.integrationAccountId,
                integrationAccountIds,
              )
            : undefined,
          tasklistIds
            ? inArray(memoryTaskTable.tasklistId, tasklistIds)
            : undefined,
        ],
        {
          contentEmbedding,
          descriptionEmbedding,
          startDate,
          endDate,
          taskStates,
          sortBy,
          orderBy,
        },
        db,
      )
    : [];

  return [...memoryEvents, ...memoryTasks];
}

export async function queryMemoryEvents(
  baseFilters: (SQLWrapper | undefined)[],
  options: {
    contentEmbedding?: number[];
    descriptionEmbedding?: number[];
    startDate?: Date;
    endDate?: Date;
    sortBy?: MemorySortBy;
    orderBy?: OrderBy;
  },
  db: TransactableDBType = dbClient,
): Promise<QueriedMemory[]> {
  const { startDate, endDate, contentEmbedding, descriptionEmbedding } =
    options;

  const contentSimilarity = contentEmbedding
    ? sql<number>`1 - (${cosineDistance(
        memoryTable.contentEmbedding,
        contentEmbedding,
      )})`
    : sql<number>`1`;

  const descriptionSimilarity = descriptionEmbedding
    ? sql<number>`1 - (${cosineDistance(
        memoryTable.descriptionEmbedding,
        descriptionEmbedding,
      )})`
    : sql<number>`1`;

  /*
    Conditional for searching for MemoryEvents
  */
  let eventCondition: SQLWrapper | undefined;
  let eventsEndDate = endDate;

  if (startDate) {
    if (!eventsEndDate) {
      // Set endDate to 1 month from startDate
      eventsEndDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    eventCondition = or(
      /* 
      Calendar Event Overlap Query Explanation:

      To find overlapping calendar events, we need to check two conditions:
      1. The event starts before or during the query period (start_date <= query_end_date)
      2. The event ends during or after the query period (end_date >= query_start_date)

      SQL Query:
      SELECT * 
      FROM events 
      WHERE (start_date <= query_end_date) AND (end_date >= query_start_date)

      This will match:
      - Events completely within the query period
      - Events that span the entire query period
      - Events that partially overlap at the start
      - Events that partially overlap at the end

      Example:
      If query period is Jan 1 - Jan 31:
      - An event from Jan 15 - Jan 20 (completely within)
      - An event from Dec 15 - Feb 15 (spans entire period)
      - An event from Dec 20 - Jan 10 (overlaps start)
      - An event from Jan 25 - Feb 5 (overlaps end)

      All these cases are captured by the two conditions in the WHERE clause.
      */
      and(
        lte(memoryEventTable.startDate, eventsEndDate),
        gte(memoryEventTable.endDate, startDate),
      ),
      and(
        isNotNull(memoryEventTable.rrule),
        and(
          lte(memoryEventTable.startDate, eventsEndDate),
          or(
            isNull(memoryEventTable.recurringEnd),
            gte(memoryEventTable.recurringEnd, startDate),
          ),
          sql<boolean>`matching_recurrences(${memoryEventTable.startDate}, ${
            memoryEventTable.rrule
          }, ${startDate.toISOString()}, ${endDate?.toISOString() ?? null})`,
        ),
      ),
    );
  }

  const entries = await db
    .select({
      id: memoryTable.id,
      content: memoryTable.content,
      description: memoryTable.description,
      createdAt: memoryTable.createdAt,
      source: memoryTable.source,
      contentSimilarity,
      descriptionSimilarity,
      similarity: sql<number>`${contentSimilarity} * ${descriptionSimilarity}`,
      lastUpdate: memoryTable.lastUpdate,
      event: memoryEventTable,
      calendar: calendarTable,
      isVirtual: sql<boolean>`FALSE`,
    })
    .from(memoryTable)
    .leftJoin(memoryEventTable, eq(memoryTable.id, memoryEventTable.memoryId))
    .leftJoin(calendarTable, eq(memoryEventTable.calendarId, calendarTable.id))
    .where(
      and(
        ...baseFilters,
        eventCondition ?? sql`TRUE`,
        or(isNull(calendarTable.hidden), not(calendarTable.hidden)),
      ),
    )
    .orderBy((t) => {
      const order = options.orderBy === "asc" ? asc : desc;

      switch (options.sortBy) {
        case "similarity": {
          return [order(t.similarity)];
        }
        case "relevantDate": {
          return [order(t.event.startDate)];
        }
        case "priority": {
          return [order(t.event.startDate)];
        }
        case "createdAt": {
          return [order(t.createdAt)];
        }
        case "lastUpdate": {
          return [order(t.lastUpdate)];
        }
        default: {
          return [order(t.lastUpdate)];
        }
      }
    })
    .limit(10);

  for (const entry of entries) {
    if (!entry.event?.rrule || !startDate) {
      continue;
    }

    const eventEntry = entry.event;

    const diff =
      entry.event.endDate.getTime() - entry.event.startDate.getTime();

    const otherDates = processRrule(
      entry.event.rrule,
      entry.event.startDate,
      startDate,
      endDate ?? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    );

    entries.push(
      ...otherDates.map((date) => ({
        ...entry,
        event: {
          ...eventEntry,
          startDate: date,
          endDate: new Date(date.getTime() + diff),
        },
        isVirtual: true,
      })),
    );
  }

  return entries.map((m) => ({
    ...m,
    task: null,
    tasklist: null,
    taskAttributes: [],
  }));
}

export async function queryMemoryTasks(
  baseFilters: (SQLWrapper | undefined)[],
  options: {
    contentEmbedding?: number[];
    descriptionEmbedding?: number[];
    startDate?: Date;
    endDate?: Date;
    taskStates?: Set<TaskState>;
    sortBy?: MemorySortBy;
    orderBy?: OrderBy;
  },
  db: TransactableDBType = dbClient,
): Promise<QueriedMemory[]> {
  const {
    startDate,
    endDate,
    contentEmbedding,
    descriptionEmbedding,
    taskStates,
  } = options;

  const contentSimilarity = contentEmbedding
    ? sql<number>`1 - (${cosineDistance(
        memoryTable.contentEmbedding,
        contentEmbedding,
      )})`
    : sql<number>`1`;

  const descriptionSimilarity = descriptionEmbedding
    ? sql<number>`1 - (${cosineDistance(
        memoryTable.descriptionEmbedding,
        descriptionEmbedding,
      )})`
    : sql<number>`1`;

  let dueDateCondition: SQLWrapper | undefined;

  if (startDate) {
    dueDateCondition = or(
      and(
        gte(memoryTaskTable.dueDate, startDate),
        endDate ? lte(memoryTaskTable.dueDate, endDate) : undefined,
      ),
      isNull(memoryTaskTable.dueDate),
    );
  }

  const latestStateSubquery = db
    .select({
      state: memoryTaskAttributeTable.state,
    })
    .from(memoryTaskAttributeTable)
    .where(
      and(
        eq(memoryTaskAttributeTable.memoryTaskId, memoryTaskTable.id),
        isNotNull(memoryTaskAttributeTable.state),
      ),
    )
    .orderBy(desc(memoryTaskAttributeTable.createdAt))
    .limit(1)
    .as("latestState");

  const latestPrioritySubquery = db
    .select({
      priority: memoryTaskAttributeTable.priority,
    })
    .from(memoryTaskAttributeTable)
    .where(
      and(
        eq(memoryTaskAttributeTable.memoryTaskId, memoryTaskTable.id),
        isNotNull(memoryTaskAttributeTable.priority),
      ),
    )
    .orderBy(desc(memoryTaskAttributeTable.createdAt))
    .limit(1)
    .as("latestPriority");

  const entries = await db
    .select({
      id: memoryTable.id,
      content: memoryTable.content,
      description: memoryTable.description,
      createdAt: memoryTable.createdAt,
      source: memoryTable.source,
      contentSimilarity,
      descriptionSimilarity,
      similarity: sql<number>`${contentSimilarity} * ${descriptionSimilarity}`,
      lastUpdate: memoryTable.lastUpdate,
      task: memoryTaskTable,
      tasklist: tasklistsTable,
      latestState: latestStateSubquery.state,
      latestPriority: latestPrioritySubquery.priority,
      isVirtual: sql<boolean>`FALSE`,
    })
    .from(memoryTable)
    .leftJoin(memoryTaskTable, eq(memoryTable.id, memoryTaskTable.memoryId))
    .leftJoin(tasklistsTable, eq(memoryTaskTable.tasklistId, tasklistsTable.id))
    .leftJoinLateral(latestStateSubquery, sql`true`)
    .leftJoinLateral(latestPrioritySubquery, sql`true`)
    .where(
      and(
        ...baseFilters,
        dueDateCondition,
        taskStates
          ? inArray(latestStateSubquery.state, Array.from(taskStates))
          : undefined,
      ),
    )
    .orderBy((t) => {
      const order = options.orderBy === "asc" ? asc : desc;

      switch (options.sortBy) {
        case "similarity": {
          return [order(t.similarity)];
        }
        case "priority": {
          return [order(t.latestPriority)];
        }
        case "createdAt": {
          return [order(t.createdAt)];
        }
        case "lastUpdate": {
          return [order(t.lastUpdate)];
        }
        case "relevantDate": {
          return [order(t.task.dueDate)];
        }
        default: {
          return [order(t.lastUpdate)];
        }
      }
    })
    .limit(10);

  return Promise.all(
    entries.map(async (entry) => {
      const baseEntry = {
        ...entry,
        event: null,
        calendar: null,
      };

      if (!entry.task?.id) {
        return {
          ...baseEntry,
          taskAttributes: [],
        };
      }
      const taskAttributes = await db
        .select()
        .from(memoryTaskAttributeTable)
        .where(eq(memoryTaskAttributeTable.memoryTaskId, entry.task.id));

      return {
        ...baseEntry,
        taskAttributes,
      };
    }),
  );
}

export interface QueriedMemory {
  id: string;
  content: string;
  description: string | null;
  createdAt: Date;
  source: MemorySource;
  contentSimilarity?: number;
  descriptionSimilarity?: number;
  similarity?: number;
  lastUpdate: Date;
  event: MemoryEvent | null;
  calendar: DBCalendar | null;
  task: MemoryTask | null;
  tasklist: Tasklist | null;
  taskAttributes: MemoryTaskAttribute[];
  isVirtual: boolean;
}

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
