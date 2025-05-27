import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import {
  CALENDAR_SOURCES,
  GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
  GOOGLE_CALENDAR_EVENT_TYPES,
  MEMORY_SORT_BY,
  ORDER_BY,
  TASK_SOURCES,
  TASK_STATES,
} from "../../db";

const queriedMemorySchema = z.object({
  id: z.uuid(),
  content: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  lastUpdate: z.date(),
  event: z
    .object({
      id: z.uuid(),
      icalUid: z.string(),
      integrationAccountId: z.uuid(),
      platformId: z.string(),
      platformAccountId: z.string(),
      platformCalendarId: z.string(),
      calendarId: z.uuid(),
      source: z.enum(CALENDAR_SOURCES),
      sequence: z.number(),
      startDate: z.date(),
      startDateTimeZone: z.string().nullable(),
      endDate: z.date(),
      endDateTimeZone: z.string().nullable(),
      isFullDay: z.boolean(),
      attendenceStatus: z.enum(GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS),
      isOrganizer: z.boolean(),
      organizerEmail: z.string().nullable(),
      isCreator: z.boolean(),
      creatorEmail: z.string().nullable(),
      eventType: z.enum(GOOGLE_CALENDAR_EVENT_TYPES),
      platformData: z.any(),
      rrule: z.string().nullable(),
      recurringEnd: z.date().nullable(),
      recurringEventPlatformId: z.string().nullable(),
      startOriginal: z.date().nullable(),
      startOriginalTimeZone: z.string().nullable(),
      deletedInstance: z.boolean(),

      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .nullable(),
  calendar: z
    .object({
      id: z.uuid(),
      integrationAccountId: z.uuid(),
      platformCalendarId: z.string(),
      platformAccountId: z.string(),
      userId: z.uuid(),
      summary: z.string().nullable(),
      summaryOverride: z.string().nullable(),
      description: z.string().nullable(),
      color: z.string().nullable(),
      colorOverride: z.string().nullable(),
      timeZone: z.string().nullable(),
      hidden: z.boolean(),
      platformData: z.any(),
      lastSynced: z.date().nullable(),
      source: z.enum(CALENDAR_SOURCES),
      createdAt: z.date(),
      lastUpdate: z.date(),
    })
    .nullable(),
  task: z
    .object({
      id: z.uuid(),
      tasklistId: z.uuid(),
      integrationAccountId: z.uuid(),
      platformAccountId: z.string(),
      platformTaskListId: z.string(),
      platformTaskId: z.string(),
      source: z.enum(TASK_SOURCES),

      dueDate: z.date().nullable(),
      recurrence: z.string().nullable(),
      recurrenceEnd: z.date().nullable(),

      createdAt: z.date(),
      updatedAt: z.date(),
    })
    .nullable(),
  tasklist: z
    .object({
      id: z.uuid(),
      integrationAccountId: z.uuid(),
      platformAccountId: z.string(),
      platformTaskListId: z.string(),
      source: z.enum(TASK_SOURCES),
      name: z.string(),
      config: z.any(),

      color: z.string().nullable(),
      colorOverride: z.string().nullable(),
      hidden: z.boolean(),

      createdAt: z.date(),
      updatedAt: z.date(),
      lastSynced: z.date().nullable(),
    })
    .nullable(),
  taskAttributes: z.array(
    z.object({
      id: z.uuid(),
      platformAttributeId: z.string(),
      state: z.enum(TASK_STATES).nullable(),
      priority: z.number().nullable(),
      platformValue: z.string().nullable(),

      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
  isVirtual: z.boolean(),
});

export const v1MemoriesRouter = oc.prefix("/memory").router({
  queryMemories: oc
    .route({
      path: "/",
      method: "POST",
      description: "Query memories",
    })
    .input(
      z.object({
        // Filter by content
        textQuery: z.string().max(100).optional(),

        // Filter by date
        dateFrom: z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),
        dateTo: z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),

        // Filter by integration
        integrationAccountIds: z.array(z.string().uuid()).optional(),
        calendarIds: z.array(z.string().uuid()).optional(),
        tasklistIds: z.array(z.string().uuid()).optional(),

        // Filter by calendar source
        //calendarSources: z.array(z.enum(CALENDAR_SOURCES)).optional(),

        // Filter by tasks
        //taskSources: z.array(z.enum(TASK_SOURCES)).optional(),
        taskStates: z.array(z.enum(TASK_STATES)).optional(),

        // Sort by
        sortBy: z.enum(MEMORY_SORT_BY).optional(),
        orderBy: z.enum(ORDER_BY).default("desc").optional(),
      }),
    )
    .output(z.array(queriedMemorySchema)),

  getMemories: oc
    .route({
      path: "/{memoryIds}",
      method: "GET",
      description: "Get memories",
    })
    .input(
      z.object({
        memoryIds: z.array(z.uuid()).max(25),
      }),
    )
    .output(z.array(queriedMemorySchema)),
});
