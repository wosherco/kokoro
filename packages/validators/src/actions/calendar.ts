import { z } from "zod";

import { GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS } from "../db";
import {
  calendarIdSchema,
  integrationAccountIdSchema,
  virtualEventSchema,
} from "./common";

export const CALENDAR_CREATE_EVENT_ACTION = "CALENDAR:createEvent";

export const calendarCreateEventSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  calendarId: calendarIdSchema,
  summary: z.string().describe("The summary of the calendar event."),
  startDate: z
    .string()
    .describe(
      "The start date of the calendar event. Must be in ISO 8601 format.",
    ),
  endDate: z
    .string()
    .describe(
      "The end date of the calendar event. Must be in ISO 8601 format.",
    ),
  isFullDay: z.boolean().describe("Whether the event is a full day event."),
  recurrence: z
    .string()
    .nullable()
    .describe(
      "The recurrence of the calendar event. Must follow RRULE format. Do not include DTSTART, DTEND, or EXDATE.",
    ),
});

export const CALENDAR_MODIFY_EVENT_ACTION = "CALENDAR:modifyEvent";

export const RECURRENCE_MODIFIER_TYPE = [
  "ALL",
  "THIS_AND_FOLLOWING",
  "INSTANCE",
] as const;

export type RecurrenceModifierType = (typeof RECURRENCE_MODIFIER_TYPE)[number];

const recurrenceTypeSchema = z
  .enum(RECURRENCE_MODIFIER_TYPE)
  .nullable()
  .describe(
    "ONLY IF THE EVENT YOU'RE MODIFYING HAS RECURRENCE, you must provide how the update should be made. ALL will update every instance. THIS_AND_FOLLOWING will update this instance and the following ones. INSTANCE will only update the instance you're modifying.",
  );

export const modifyCalendarEventSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  event: virtualEventSchema,
  summary: z.string().nullable().describe("The summary of the calendar event."),
  startDate: z
    .string()
    .nullable()
    .describe(
      "The start date of the calendar event. Must be in ISO 8601 format.",
    ),
  endDate: z
    .string()
    .nullable()
    .describe(
      "The end date of the calendar event. Must be in ISO 8601 format.",
    ),
  isFullDay: z
    .boolean()
    .nullable()
    .describe("Whether the event is a full day event."),
  recurrence: z
    .string()
    .nullable()
    .describe(
      "The recurrence of the calendar event. Must follow RRULE format. Do not include DTSTART, DTEND, or EXDATE.",
    ),
  recurrenceType: recurrenceTypeSchema,
});

export const CALENDAR_DELETE_EVENT_ACTION = "CALENDAR:deleteEvent";

export const deleteCalendarEventSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  event: virtualEventSchema,
  recurrenceAction: recurrenceTypeSchema,
});

export const CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION =
  "CALENDAR:changeEventAttendance";

export const changeEventAttendanceStatusSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  event: virtualEventSchema,
  state: z
    .enum(GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS)
    .describe("The state of the attendance change."),
  comment: z
    .string()
    .nullable()
    .describe("The comment to add to the attendance change."),
});

export const CalendarActions = [
  CALENDAR_CREATE_EVENT_ACTION,
  CALENDAR_MODIFY_EVENT_ACTION,
  CALENDAR_DELETE_EVENT_ACTION,
  CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION,
] as const;

export const CalendarActionSchemas = {
  [CALENDAR_CREATE_EVENT_ACTION]: calendarCreateEventSchema,
  [CALENDAR_MODIFY_EVENT_ACTION]: modifyCalendarEventSchema,
  [CALENDAR_DELETE_EVENT_ACTION]: deleteCalendarEventSchema,
  [CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION]: changeEventAttendanceStatusSchema,
} as const;
