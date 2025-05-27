import { getMemories } from "@kokoro/brain";
import {
  ReadWriteEventsSource,
  getCalendarSource,
} from "@kokoro/brain/calendar";
import { isRecurringEvent, isRecurringInstanceEvent } from "@kokoro/common";
import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { integrationsAccountsTable } from "@kokoro/db/schema";
import { isDateMatchingRrule } from "@kokoro/rrule";
import type {
  ActionPayload,
  CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION,
  CALENDAR_CREATE_EVENT_ACTION,
  CALENDAR_DELETE_EVENT_ACTION,
  CALENDAR_MODIFY_EVENT_ACTION,
} from "@kokoro/validators/actions";
import type { CalendarSource } from "@kokoro/validators/db";
import { CALENDAR_SOURCES } from "@kokoro/validators/db";

import { parseDate } from "../../utils/date";
import { checkIfVirtualEventsMatchRrule } from "../../utils/events";
import type { ActionContext } from "./context";

async function getValidatedCalendarContext(
  userId: string,
  integrationAccountId: string,
) {
  const [integrationAccount] = await db
    .select({
      id: integrationsAccountsTable.id,
      integrationType: integrationsAccountsTable.integrationType,
    })
    .from(integrationsAccountsTable)
    .where(
      and(
        eq(integrationsAccountsTable.id, integrationAccountId),
        eq(integrationsAccountsTable.userId, userId),
      ),
    );

  if (!integrationAccount) {
    throw new Error("Integration account not found");
  }

  const calendarSourceType =
    integrationAccount.integrationType as CalendarSource;

  if (!CALENDAR_SOURCES.includes(calendarSourceType)) {
    throw new Error("Calendar source is not supported");
  }

  const calendarSource = getCalendarSource(calendarSourceType);

  if (!(calendarSource instanceof ReadWriteEventsSource)) {
    throw new Error("Calendar source is not writable");
  }

  return {
    integrationAccount,
    calendarSource,
  };
}

export async function createCalendarEventAction(
  context: ActionContext,
  payload: ActionPayload<typeof CALENDAR_CREATE_EVENT_ACTION>,
) {
  const startDate = parseDate(payload.startDate);
  const endDate = parseDate(payload.endDate);

  if (!startDate || !endDate) {
    throw new Error(
      "You need to provide a start and end date to create an event.",
    );
  }

  if (startDate > endDate) {
    throw new Error("The start date cannot be after the end date.");
  }

  const { integrationAccount, calendarSource } =
    await getValidatedCalendarContext(
      context.user.id,
      payload.integrationAccountId,
    );

  const event = await calendarSource.createEvent(
    integrationAccount.id,
    payload.calendarId,
    {
      startDate,
      endDate,
      // We treat all events as UTC, so timezone is UTC
      timezone: "UTC",
      isFullDay: payload.isFullDay,
      summary: payload.summary,
      recurrence: payload.recurrence ?? undefined,
    },
  );

  return `Calendar event created successfully. The memory has the ID: ${event.memoryId}`;
}

export async function modifyCalendarEventAction(
  context: ActionContext,
  payload: ActionPayload<typeof CALENDAR_MODIFY_EVENT_ACTION>,
) {
  const [memory] = await getMemories(context.user.id, [payload.event.memoryId]);

  if (!memory?.event) {
    throw new Error("Event not found");
  }

  const isRecurring = isRecurringEvent(memory);
  const isRecurringInstance = isRecurringInstanceEvent(memory);
  const hasRecurrence = isRecurring || isRecurringInstance;

  const recurrenceType = payload.recurrenceType ?? "INSTANCE";

  const startDate = parseDate(payload.startDate);
  const endDate = parseDate(payload.endDate);

  if (payload.event.virtualStartDate) {
    if (!memory.event.rrule) {
      throw new Error("Event is not recurring");
    }

    const virtualStartDate = parseDate(payload.event.virtualStartDate);

    if (!virtualStartDate) {
      throw new Error("Invalid start date");
    }

    if (
      !isDateMatchingRrule(
        memory.event.rrule,
        memory.event.startDate,
        virtualStartDate,
      )
    ) {
      throw new Error("Start date does not match recurrence rule");
    }

    // If recurrenceType is not provided, or it's "ALL", and the event is recursive, and has a virtual start date, then the start and end date of the payload should be "relative" to the original start date calculating the difference with the virtual start date.
    if (isRecurring && recurrenceType === "ALL") {
      if (startDate) {
        const relativeOffset =
          virtualStartDate.getTime() - memory.event.startDate.getTime();
        payload.startDate = new Date(
          startDate.getTime() - relativeOffset,
        ).toISOString();
      }

      if (endDate) {
        const relativeOffset =
          virtualStartDate.getTime() - memory.event.startDate.getTime();
        payload.endDate = new Date(
          endDate.getTime() - relativeOffset,
        ).toISOString();
      }
    }

    // TODO: We might have problems with DST here. We've solved something similar in the App
    const diff =
      memory.event.endDate.getTime() - memory.event.startDate.getTime();
    memory.event.startDate = virtualStartDate;
    memory.event.endDate = new Date(virtualStartDate.getTime() + diff);
  }

  const { integrationAccount, calendarSource } =
    await getValidatedCalendarContext(
      context.user.id,
      payload.integrationAccountId,
    );

  await calendarSource.updateEvent(
    integrationAccount.id,
    memory.id,
    {
      startDate,
      endDate,
      summary: payload.summary ?? undefined,
      isFullDay: payload.isFullDay ?? undefined,
      recurrence: payload.recurrence,
      // We process dates in UTC, so timezone is UTC
      timezone: "UTC",
    },
    hasRecurrence
      ? {
          type: recurrenceType,
          virtualStartDate: parseDate(payload.event.virtualStartDate ?? null),
        }
      : undefined,
  );

  return "Calendar event updated successfully.";
}

export async function deleteCalendarEventAction(
  context: ActionContext,
  payload: ActionPayload<typeof CALENDAR_DELETE_EVENT_ACTION>,
) {
  const [memory] = await getMemories(context.user.id, [payload.event.memoryId]);

  if (!memory?.event) {
    throw new Error("Event not found");
  }

  checkIfVirtualEventsMatchRrule(memory, payload.event);

  const payloadVirtualStartDate = parseDate(payload.event.virtualStartDate);

  const { integrationAccount, calendarSource } =
    await getValidatedCalendarContext(
      context.user.id,
      payload.integrationAccountId,
    );

  await calendarSource.deleteEvent(
    integrationAccount.id,
    memory.id,
    (memory.event.recurringEventPlatformId || memory.event.rrule) &&
      payload.recurrenceAction
      ? {
          type: payload.recurrenceAction,
          virtualStartDate: payloadVirtualStartDate,
        }
      : undefined,
  );

  return "Event deleted successfully.";
}

export async function changeEventAttendanceAction(
  context: ActionContext,
  payload: ActionPayload<typeof CALENDAR_CHANGE_EVENT_ATTENDANCE_ACTION>,
) {
  const [memory] = await getMemories(context.user.id, [payload.event.memoryId]);

  if (!memory?.event) {
    throw new Error("Event not found");
  }

  const { integrationAccount, calendarSource } =
    await getValidatedCalendarContext(
      context.user.id,
      payload.integrationAccountId,
    );

  await calendarSource.updateEvent(
    integrationAccount.id,
    memory.id,
    {
      startDate: null,
      endDate: null,
      summary: null,
      isFullDay: null,
      recurrence: null,
      timezone: null,
      selfAttendance: {
        status: payload.state,
        comment: payload.comment,
      },
    },
    isRecurringEvent(memory) || isRecurringInstanceEvent(memory)
      ? {
          type: "INSTANCE",
          virtualStartDate: parseDate(payload.event.virtualStartDate ?? null),
        }
      : undefined,
  );

  return "Events attendance changed successfully.";
}
