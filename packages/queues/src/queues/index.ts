import type { z } from "zod";

import {
  CALENDAR_EVENTS_SYNC_QUEUE,
  calendarEventsSyncSchema,
} from "./calendarEventsSync";
import { CALENDARS_SYNC_QUEUE, calendarsSyncSchema } from "./calendarsSync";
import { CONTACTS_SYNC_QUEUE, contactsSyncSchema } from "./contactsSync";
import {
  FULFILL_EMBEDDING_QUEUE,
  fulfillEmbeddingSchema,
} from "./fulfillEmbedding";
import {
  GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE,
  googleCalendarChannelsRefreshSchema,
} from "./googleCalendarChannelsRefresh";
import {
  GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE,
  googleCalendarScheduledSyncSchema,
} from "./googleCalendarScheduledSync";
import {
  GOOGLE_CALENDAR_WATCH_QUEUE,
  googleCalendarWatchSchema,
} from "./googleCalendarWatch";
import {
  GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE,
  googleContactsScheduledSyncSchema,
} from "./googleContactsScheduledSync";
import { TASK_SYNC_QUEUE, taskSyncSchema } from "./taskSync";
import { TASKLIST_SYNC_QUEUE, tasklistSyncSchema } from "./tasklistSync";

export * from "./googleCalendarWatch";
export * from "./googleCalendarChannelsRefresh";
export * from "./googleCalendarScheduledSync";
export * from "./googleContactsScheduledSync";
export * from "./fulfillEmbedding";
export * from "./tasklistSync";
export * from "./taskSync";
export * from "./contactsSync";
export * from "./calendarsSync";
export * from "./calendarEventsSync";

export const QUEUES = [
  GOOGLE_CALENDAR_WATCH_QUEUE,
  GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE,
  GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE,
  GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE,
  FULFILL_EMBEDDING_QUEUE,
  TASKLIST_SYNC_QUEUE,
  TASK_SYNC_QUEUE,
  CONTACTS_SYNC_QUEUE,
  CALENDARS_SYNC_QUEUE,
  CALENDAR_EVENTS_SYNC_QUEUE,
] as const;

export type Queue = (typeof QUEUES)[number];

// Map of queues to their Zod schemas
export const QueueSchemaMap = {
  [GOOGLE_CALENDAR_WATCH_QUEUE]: googleCalendarWatchSchema,
  [GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE]: googleCalendarChannelsRefreshSchema,
  [GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE]: googleCalendarScheduledSyncSchema,
  [GOOGLE_CONTACTS_SCHEDULED_SYNC_QUEUE]: googleContactsScheduledSyncSchema,
  [FULFILL_EMBEDDING_QUEUE]: fulfillEmbeddingSchema,
  [TASKLIST_SYNC_QUEUE]: tasklistSyncSchema,
  [TASK_SYNC_QUEUE]: taskSyncSchema,
  [CONTACTS_SYNC_QUEUE]: contactsSyncSchema,
  [CALENDARS_SYNC_QUEUE]: calendarsSyncSchema,
  [CALENDAR_EVENTS_SYNC_QUEUE]: calendarEventsSyncSchema,
} as const;

// Infer the message types from the schemas
export type QueueMessageMap = {
  [Q in Queue]: z.infer<(typeof QueueSchemaMap)[Q]>;
};
