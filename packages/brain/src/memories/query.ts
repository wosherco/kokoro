import { filterNull, groupBy } from "@kokoro/common/poldash";
import type { PgColumn, SQLWrapper, SubqueryWithSelection } from "@kokoro/db";
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
  lte,
  not,
  or,
  sql,
  union,
} from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db as dbClient } from "@kokoro/db/client";
import type {
  DBCalendar,
  MemoryEvent,
  MemorySource,
  MemoryTask,
  MemoryTaskAttribute,
  Tasklist,
} from "@kokoro/db/schema";
import {
  calendarTable,
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

import { getEmbedding } from "../embeddings";

function createMemoryEventsSubquery(
  baseFilters: (SQLWrapper | undefined)[],
  options: {
    dateFrom?: Date;
    dateTo?: Date;
  },
  db: TransactableDBType = dbClient
) {
  const { dateFrom: startDate, dateTo: endDate } = options;

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
        gte(memoryEventTable.endDate, startDate)
      ),
      and(
        isNotNull(memoryEventTable.rrule),
        and(
          lte(memoryEventTable.startDate, eventsEndDate),
          or(
            isNull(memoryEventTable.recurringEnd),
            gte(memoryEventTable.recurringEnd, startDate)
          ),
          sql<boolean>`matching_recurrences(${memoryEventTable.startDate}, ${
            memoryEventTable.rrule
          }, ${startDate.toISOString()}, ${endDate?.toISOString() ?? null})`
        )
      )
    );
  }

  const subquery = db
    .select({
      id: memoryTable.id,
      content: memoryTable.content,
      contentEmbedding: memoryTable.contentEmbedding,
      description: memoryTable.description,
      descriptionEmbedding: memoryTable.descriptionEmbedding,
      createdAt: memoryTable.createdAt,
      lastUpdate: memoryTable.lastUpdate,
    })
    .from(memoryTable)
    .leftJoin(memoryEventTable, eq(memoryTable.id, memoryEventTable.memoryId))
    .leftJoin(calendarTable, eq(memoryEventTable.calendarId, calendarTable.id))
    .where(
      and(
        ...baseFilters,
        eventCondition ?? sql`TRUE`,
        or(isNull(calendarTable.hidden), not(calendarTable.hidden))
      )
    )
    .as("memoryEventsSubquery");

  return subquery;
}

const createLatestPrioritySubquery = (db: TransactableDBType) =>
  db
    .select({
      priority: memoryTaskAttributeTable.priority,
    })
    .from(memoryTaskAttributeTable)
    .where(
      and(
        eq(memoryTaskAttributeTable.memoryTaskId, memoryTaskTable.id),
        isNotNull(memoryTaskAttributeTable.priority)
      )
    )
    .orderBy(desc(memoryTaskAttributeTable.createdAt))
    .limit(1)
    .as("latestPriority");

function createMemoryTasksSubquery(
  baseFilters: (SQLWrapper | undefined)[],
  options: {
    dateFrom?: Date;
    dateTo?: Date;
    taskStates?: Set<TaskState>;
  },
  db: TransactableDBType = dbClient
) {
  const { dateFrom: startDate, dateTo: endDate, taskStates } = options;

  let dueDateCondition: SQLWrapper | undefined;

  if (startDate) {
    dueDateCondition = or(
      and(
        gte(memoryTaskTable.dueDate, startDate),
        endDate ? lte(memoryTaskTable.dueDate, endDate) : undefined
      ),
      isNull(memoryTaskTable.dueDate)
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
        isNotNull(memoryTaskAttributeTable.state)
      )
    )
    .orderBy(desc(memoryTaskAttributeTable.createdAt))
    .limit(1)
    .as("latestState");

  // Maybe allow for users to filter by priority too?
  // const latestPrioritySubquery = createLatestPrioritySubquery(db);

  const subquery = db
    .select({
      id: memoryTable.id,
      content: memoryTable.content,
      contentEmbedding: memoryTable.contentEmbedding,
      description: memoryTable.description,
      descriptionEmbedding: memoryTable.descriptionEmbedding,
      createdAt: memoryTable.createdAt,
      lastUpdate: memoryTable.lastUpdate,
    })
    .from(memoryTable)
    .leftJoin(memoryTaskTable, eq(memoryTable.id, memoryTaskTable.memoryId))
    .leftJoin(tasklistsTable, eq(memoryTaskTable.tasklistId, tasklistsTable.id))
    .leftJoinLateral(latestStateSubquery, sql`true`)
    .where(
      and(
        ...baseFilters,
        dueDateCondition,
        taskStates
          ? inArray(latestStateSubquery.state, Array.from(taskStates))
          : undefined
      )
    )
    .as("memoryTasksSubquery");

  return subquery;
}

export interface QueriedMemory {
  id: string;
  content: string;
  description: string | null;
  createdAt: Date;
  source: MemorySource;
  lastUpdate: Date;
  event: MemoryEvent | null;
  calendar: DBCalendar | null;
  task: MemoryTask | null;
  tasklist: Tasklist | null;
  taskAttributes: MemoryTaskAttribute[];
  isVirtual: boolean;
}

/**
 * Process memory tasks to include task attributes
 */
function processMemoryTasks<
  T extends { taskAttributes: MemoryTaskAttribute | null }
>(
  memory: T[]
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

/**
 * Process memory events to include virtual events
 */
function processMemoryEvents(
  memories: QueriedMemory[],
  startDate: Date,
  endDate?: Date
) {
  for (const memory of memories) {
    if (!memory.event?.rrule) {
      continue;
    }

    const memoryEvent = memory.event;

    const diff =
      memoryEvent.endDate.getTime() - memoryEvent.startDate.getTime();

    const otherDates = processRrule(
      memory.event.rrule,
      memory.event.startDate,
      startDate,
      endDate ?? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    );

    memories.push(
      ...otherDates.map((date) => ({
        ...memory,
        event: {
          ...memoryEvent,
          startDate: date,
          endDate: new Date(date.getTime() + diff),
        },
        isVirtual: true,
      }))
    );
  }

  return memories;
}

export async function getMemories(
  userId: string,
  ids: string[],
  db: TransactableDBType = dbClient
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
      eq(memoryTaskTable.id, memoryTaskAttributeTable.memoryTaskId)
    )
    .where(and(inArray(memoryTable.id, ids), eq(memoryTable.userId, userId)));

  const groupedMemories = groupBy(rows, "id");

  const processedMemories = filterNull(
    Object.values(groupedMemories).map(processMemoryTasks)
  );

  return processMemoryEvents(processedMemories, new Date(), undefined);
}

export async function queryMemories(
  userId: string,
  options: {
    // Filter by content
    textQuery?: string;

    // Filter by date
    dateFrom?: Date;
    dateTo?: Date;

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
     * When textQuery is not provided, this will be used to sort the results
     *
     * @default "relevantDate"
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
  db: TransactableDBType = dbClient
): Promise<QueriedMemory[]> {
  const {
    textQuery,
    dateFrom: startDate,
    dateTo: endDate,
    integrationAccountIds,
    calendarIds,
    tasklistIds,
    calendarSources,
    taskSources,
    taskStates,
    sortBy = "relevantDate",
    orderBy = "desc",
  } = options;

  const textEmbedding = textQuery?.trim()
    ? await getEmbedding(textQuery)
    : undefined;

  let sourceCondition = sql`TRUE`;

  if (options.source !== undefined) {
    sourceCondition = inArray(
      memoryTable.source,
      options.source instanceof Set
        ? Array.from(options.source)
        : [options.source]
    );
  }

  const baseFilters = [
    eq(memoryTable.userId, userId),
    sourceCondition,
    textEmbedding
      ? sql<boolean>`${memoryTable.content} <> '' or ${memoryTable.description} <> ''`
      : undefined,
  ];

  const shouldIncludeMemoryType = (type: MemoryType) =>
    options.memoryTypes && options.memoryTypes.size > 0
      ? options.memoryTypes.has(type)
      : true;

  const memoryEventsSubquery = shouldIncludeMemoryType(EVENT_MEMORY_TYPE)
    ? createMemoryEventsSubquery(
        [
          isNotNull(memoryEventTable.id),
          ...baseFilters,
          calendarSources
            ? inArray(memoryEventTable.source, Array.from(calendarSources))
            : undefined,
          integrationAccountIds
            ? inArray(
                memoryEventTable.integrationAccountId,
                integrationAccountIds
              )
            : undefined,
          calendarIds
            ? inArray(memoryEventTable.calendarId, calendarIds)
            : undefined,
        ],
        {
          dateFrom: startDate,
          dateTo: endDate,
        },
        db
      )
    : undefined;

  const memoryTasksSubquery = shouldIncludeMemoryType(TASK_MEMORY_TYPE)
    ? createMemoryTasksSubquery(
        [
          isNotNull(memoryTaskTable.id),
          ...baseFilters,
          taskSources
            ? inArray(memoryTaskTable.source, Array.from(taskSources))
            : undefined,
          integrationAccountIds
            ? inArray(
                memoryTaskTable.integrationAccountId,
                integrationAccountIds
              )
            : undefined,
          tasklistIds
            ? inArray(memoryTaskTable.tasklistId, tasklistIds)
            : undefined,
        ],
        {
          dateFrom: startDate,
          dateTo: endDate,
          taskStates,
        },
        db
      )
    : undefined;

  if (!memoryEventsSubquery && !memoryTasksSubquery) {
    return [];
  }

  const memoriesSubquery =
    // biome-ignore lint/style/noNonNullAssertion: this is wrong
    (
      memoryEventsSubquery && memoryTasksSubquery
        ? union(
            db.select().from(memoryEventsSubquery),
            db.select().from(memoryTasksSubquery)
          ).as("memoriesSubquery")
        : memoryEventsSubquery ?? memoryTasksSubquery
    )!;

  let resultsSubquery: SubqueryWithSelection<
    {
      id: (typeof memoriesSubquery)["id"];
    },
    "resultsSubquery"
  >;

  if (textQuery && textEmbedding) {
    const searchResultsSubquery = db
      .select({
        id: memoriesSubquery.id,
        content: memoriesSubquery.content,
        description: memoriesSubquery.description,
        contentEmbedding: memoriesSubquery.contentEmbedding,
        descriptionEmbedding: memoriesSubquery.descriptionEmbedding,
        contentRank: sql<number>`ts_rank_cd(
      to_tsvector('english', coalesce(${memoriesSubquery.content}, '')),
      websearch_to_tsquery('english', ${textQuery})
    )`.as("contentRank"),
        descriptionRank: sql<number>`ts_rank_cd(
      to_tsvector('english', coalesce(${memoriesSubquery.description}, '')),
      websearch_to_tsquery('english', ${textQuery})
    )`.as("descriptionRank"),
        contentDistance: sql<number>`${cosineDistance(
          memoriesSubquery.contentEmbedding,
          textEmbedding
        )}`.as("contentDistance"),
        descriptionDistance: sql<number>`${cosineDistance(
          memoriesSubquery.descriptionEmbedding,
          textEmbedding
        )}`.as("descriptionDistance"),
      })
      .from(memoriesSubquery)
      .where(
        and(
          or(
            sql<boolean>`to_tsvector('english', coalesce(${memoriesSubquery.content}, '')) @@ websearch_to_tsquery('english', ${textQuery})`,
            sql<boolean>`to_tsvector('english', coalesce(${memoriesSubquery.description}, '')) @@ websearch_to_tsquery('english', ${textQuery})`
          ),
          or(
            isNotNull(memoriesSubquery.contentEmbedding),
            isNotNull(memoriesSubquery.descriptionEmbedding)
          )
        )
      )
      .as("searchResultsSubquery");

    const rankedResultsSubquery = db
      .select({
        id: searchResultsSubquery.id,
        content: searchResultsSubquery.content,
        description: searchResultsSubquery.description,
        contentEmbedding: searchResultsSubquery.contentEmbedding,
        descriptionEmbedding: searchResultsSubquery.descriptionEmbedding,
        contentRank: searchResultsSubquery.contentRank,
        descriptionRank: searchResultsSubquery.descriptionRank,
        contentDistance: searchResultsSubquery.contentDistance,
        descriptionDistance: searchResultsSubquery.descriptionDistance,
        fullTextRank:
          sql<number>`(coalesce(${searchResultsSubquery.contentRank}, 0) + coalesce(${searchResultsSubquery.descriptionRank}, 0)) / 2`.as(
            "fullTextRank"
          ),
        semanticDistance:
          sql<number>`(coalesce(${searchResultsSubquery.contentDistance}, 0) + coalesce(${searchResultsSubquery.descriptionDistance}, 0)) / 2`.as(
            "semanticDistance"
          ),
      })
      .from(searchResultsSubquery)
      .as("rankedResultsSubquery");

    const RRF_K = 50;
    const FULL_TEXT_RANK_WEIGHT = 1;
    const FULL_TEXT_DISTANCE_WEIGHT = 1;

    const finalRankingSubquery = db
      .select({
        id: rankedResultsSubquery.id,
        fullTextRankIx:
          sql<number>`row_number() over (order by ${rankedResultsSubquery.fullTextRank} desc)`.as(
            "fullTextRankIx"
          ),
        semanticDistance: rankedResultsSubquery.semanticDistance,
        semanticRankIx:
          sql<number>`row_number() over (order by ${rankedResultsSubquery.semanticDistance} asc)`.as(
            "semanticRankIx"
          ),
      })
      .from(rankedResultsSubquery)
      .as("finalRankingSubquery");

    resultsSubquery = db
      .select({
        id: finalRankingSubquery.id,
      })
      .from(finalRankingSubquery)
      .orderBy(
        desc(
          sql<number>`
          coalesce(1.0 / (${RRF_K} + ${finalRankingSubquery.fullTextRankIx}), 0.0) * ${FULL_TEXT_RANK_WEIGHT} +
          coalesce(1.0 / (${RRF_K} + ${finalRankingSubquery.semanticRankIx}), 0.0) * ${FULL_TEXT_DISTANCE_WEIGHT}`
        )
      )
      .limit(30)
      .as("resultsSubquery");
  } else {
    const latestPrioritySubquery = createLatestPrioritySubquery(db);

    resultsSubquery = db
      .select({ id: memoriesSubquery.id })
      .from(memoriesSubquery)
      .leftJoin(
        memoryEventTable,
        eq(memoriesSubquery.id, memoryEventTable.memoryId)
      )
      .leftJoin(
        memoryTaskTable,
        eq(memoriesSubquery.id, memoryTaskTable.memoryId)
      )
      .leftJoinLateral(latestPrioritySubquery, sql`true`)
      .orderBy(() => {
        const order = orderBy === "asc" ? asc : desc;

        switch (sortBy) {
          case "priority": {
            return [order(latestPrioritySubquery.priority)];
          }
          case "createdAt": {
            return [order(memoriesSubquery.createdAt)];
          }
          case "updatedAt": {
            return [order(memoriesSubquery.lastUpdate)];
          }
          // case "relevantDate":
          default: {
            return [
              order(memoryEventTable.startDate),
              order(memoryTaskTable.dueDate),
            ];
          }
        }
      })
      .limit(15)
      .as("resultsSubquery");
  }

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
    .from(resultsSubquery)
    .innerJoin(memoryTable, eq(resultsSubquery.id, memoryTable.id))
    .leftJoin(memoryEventTable, eq(memoryEventTable.memoryId, memoryTable.id))
    .leftJoin(calendarTable, eq(memoryEventTable.calendarId, calendarTable.id))
    .leftJoin(memoryTaskTable, eq(memoryTaskTable.memoryId, memoryTable.id))
    .leftJoin(tasklistsTable, eq(memoryTaskTable.tasklistId, tasklistsTable.id))
    .leftJoin(
      memoryTaskAttributeTable,
      eq(memoryTaskTable.id, memoryTaskAttributeTable.memoryTaskId)
    );

  const groupedMemories = groupBy(rows, "id");

  // Process tasks with attributes
  const processedMemories = filterNull(
    Object.values(groupedMemories).map(processMemoryTasks)
  );

  // Process recurrent events
  return processMemoryEvents(
    processedMemories,
    startDate ?? new Date(),
    endDate
  );
}
