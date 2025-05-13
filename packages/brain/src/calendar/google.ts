import { isRecurringEvent, isRecurringInstanceEvent } from "@kokoro/common";
import type { Modifiable } from "@kokoro/common/poldash";
import { filterUndefined } from "@kokoro/common/poldash";
import { and, eq, gte, lte, sql } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db } from "@kokoro/db/client";
import type {
  MemoryEvent,
  SimpleMemory,
  SimpleMemoryEventAttendant,
} from "@kokoro/db/schema";
import {
  calendarTable,
  externalGoogleCalendarEventsWatchersTable,
  memoryEventTable,
  memoryTable,
} from "@kokoro/db/schema";
import type { GoogleAccount } from "@kokoro/google";
import { withGoogleAccount } from "@kokoro/google";
import type {
  BaseGoogleCalendarEventCompatibleValues,
  GoogleCalendarEvent,
  GoogleCalendarListEntry,
} from "@kokoro/google/calendar";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchRecurringInstance,
  mutateCalendarEvent,
  mutateCalendarEventRecurrenceInstance,
  mutateRecurrentCalendarEventThisAndFollowing,
  stopWatchingCalendarEvents,
  stopWatchingCalendarList,
  syncCalendarEvents,
  syncCalendarList,
} from "@kokoro/google/calendar";
import { checkDate } from "@kokoro/google/utils";
import {
  CALENDAR_EVENTS_SYNC_QUEUE,
  FULFILL_EMBEDDING_QUEUE,
  GOOGLE_CALENDAR_WATCH_QUEUE,
  publish,
} from "@kokoro/queues";
import { applyUntilToRrule, getRruleEndDate } from "@kokoro/rrule";
import type {
  GoogleCalendarEventAttendantStatus,
  GoogleCalendarEventStatus,
  GoogleCalendarEventTransparency,
  GoogleCalendarEventType,
  GoogleCalendarEventVisibility,
} from "@kokoro/validators/db";
import {
  GOOGLE_CALENDAR,
  GOOGLE_CALENDAR_EVENT_ACCESS_ROLES,
  GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
  GOOGLE_CALENDAR_EVENT_STATUS,
  GOOGLE_CALENDAR_EVENT_TRANSPARENCY,
  GOOGLE_CALENDAR_EVENT_TYPES,
  GOOGLE_CALENDAR_EVENT_VISIBILITY,
} from "@kokoro/validators/db";

import { getMemories, upsertMemory } from "..";
import { checkEnum } from "../utils/google";
import type {
  ProcessCalendarContext,
  ProcessEventContext,
  RecurrenceModifierEventInfo,
  SupportedEventFields,
} from "./base";
import { ReadWriteEventsSource } from "./base";

function autofillEventData(
  memory: SimpleMemory,
  memoryEvent: MemoryEvent,
  changes: Modifiable<SupportedEventFields>,
): BaseGoogleCalendarEventCompatibleValues {
  const {
    startDate,
    endDate,
    isFullDay,
    summary,
    description,
    timezone,
    recurrence,
    selfAttendance,
  } = changes;

  return {
    startDate: startDate ?? memoryEvent.startDate,
    endDate: endDate ?? memoryEvent.endDate,
    isFullDay: isFullDay ?? memoryEvent.isFullDay,
    summary: summary ?? memory.content,
    description: description ?? memory.description ?? undefined,
    timezone:
      timezone ??
      memoryEvent.startDateTimeZone ??
      memoryEvent.endDateTimeZone ??
      "UTC",
    recurrence:
      recurrence?.split("\n") ?? memoryEvent.rrule?.split("\n") ?? undefined,
    selfAttendance: selfAttendance ?? undefined,
  };
}

interface AdditionalContext {
  googleAccount: GoogleAccount;
}

export class GoogleCalendarEventSource extends ReadWriteEventsSource<
  GoogleCalendarListEntry,
  GoogleCalendarEvent,
  AdditionalContext
> {
  async processCalendar(
    context: ProcessCalendarContext & AdditionalContext,
    item: GoogleCalendarListEntry,
    tx: TransactableDBType,
  ): Promise<{ id: string; deleted: boolean; inserted: boolean }> {
    if (!item.id) {
      throw new Error("Missing calendar id");
    }

    const isDeleted = item.deleted ?? false;

    try {
      if (isDeleted) {
        // Remove channels
        const [channel] = await tx
          .select()
          .from(externalGoogleCalendarEventsWatchersTable)
          .where(
            and(
              eq(externalGoogleCalendarEventsWatchersTable.calendarId, item.id),
              eq(
                externalGoogleCalendarEventsWatchersTable.integrationAccountId,
                context.googleAccount.integrationAccountId,
              ),
            ),
          );

        if (channel) {
          await stopWatchingCalendarEvents(
            context.googleAccount,
            channel.calendarId,
            tx,
          );
        }

        // Remove events
        await tx
          .delete(calendarTable)
          .where(
            and(
              eq(calendarTable.platformCalendarId, item.id),
              eq(calendarTable.platformAccountId, context.platformAccountId),
            ),
          );

        return { id: item.id, deleted: true, inserted: false };
      }

      const accessRole =
        checkEnum(item.accessRole, GOOGLE_CALENDAR_EVENT_ACCESS_ROLES) ??
        undefined;

      const calendarData = {
        userId: context.userId,
        integrationAccountId: context.googleAccount.integrationAccountId,
        platformAccountId: context.platformAccountId,
        platformCalendarId: item.id,
        source: GOOGLE_CALENDAR,
        summary: item.summaryOverride ?? item.summary,
        description: item.description,
        color: item.backgroundColor ?? item.foregroundColor,
        timeZone: item.timeZone,
        hidden: item.hidden ?? false,
        platformData: {
          accessRole: accessRole ?? "reader",
          primary: item.primary ?? false,
        },
      } as const;

      console.log("calendarData", calendarData);

      const [calendar] = await tx
        .insert(calendarTable)
        .values(calendarData)
        .onConflictDoUpdate({
          target: [
            calendarTable.platformCalendarId,
            calendarTable.platformAccountId,
            calendarTable.source,
          ],
          set: calendarData,
        })
        .returning({
          id: calendarTable.id,
          isInsert: sql<boolean>`xmax = 0`,
        });

      if (!calendar) {
        throw new Error("Failed to create calendar");
      }

      return { id: calendar.id, deleted: false, inserted: calendar.isInsert };
    } catch (error) {
      console.error(
        `[ACCOUNT ${context.platformAccountId}][CALENDAR ${item.id}] Error:`,
        error,
      );
      // Re-throw the error to let the transaction handler deal with it
      throw error;
    }
  }

  async syncCalendars(integrationAccountId: string): Promise<void> {
    const insertedCalendars = new Set<string>();

    await withGoogleAccount(
      integrationAccountId,
      GOOGLE_CALENDAR,
      async (googleAccount) => {
        await syncCalendarList(googleAccount, async (tx, items) => {
          const processedCalendars = [];
          for (const item of items) {
            const processed = await this.processCalendar(
              {
                userId: googleAccount.userId,
                platformAccountId: googleAccount.platformAccountId,
                integrationAccountId: googleAccount.integrationAccountId,
                googleAccount,
              },
              item,
              tx,
            );
            processedCalendars.push(processed);
          }

          for (const calendar of processedCalendars) {
            if (calendar.inserted) {
              insertedCalendars.add(calendar.id);
            }
          }
        });

        await Promise.all(
          Array.from(insertedCalendars).map(async (calendarId) =>
            Promise.all([
              publish(GOOGLE_CALENDAR_WATCH_QUEUE, {
                integrationAccountId,
                calendarId,
                userId: googleAccount.userId,
              }),
              publish(CALENDAR_EVENTS_SYNC_QUEUE, {
                integrationAccountId,
                calendarId,
                source: GOOGLE_CALENDAR,
              }),
            ]),
          ),
        );
      },
    );
  }

  async processEvent(
    context: ProcessEventContext & AdditionalContext,
    item: GoogleCalendarEvent,
    db: TransactableDBType,
  ): Promise<{ memoryId: string; deleted: boolean }> {
    const { userId, platformAccountId, platformCalendarId, calendarId } =
      context;
    try {
      if (!item.id || !item.iCalUID) {
        throw new Error("Missing event id or iCalUID");
      }

      console.log(
        `[ACCOUNT ${platformAccountId}][CALENDAR ${calendarId}][EVENT ${
          item.id
        }] Processing | Summary: ${item.summary ?? "No summary"}`,
      );

      const {
        date: startDate,
        isFullDay,
        timeZone: startTimeZone,
      } = checkDate(item.start);
      const { date: startOriginal, timeZone: startOriginalTimeZone } =
        checkDate(item.originalStartTime);
      const { date: end, timeZone: endTimeZone } = checkDate(item.end);

      if (!startDate || !end) {
        throw new Error("Start and end date is required");
      }

      const eventType = checkEnum<GoogleCalendarEventType>(
        item.eventType,
        GOOGLE_CALENDAR_EVENT_TYPES,
      );
      const status = checkEnum<GoogleCalendarEventStatus>(
        item.status,
        GOOGLE_CALENDAR_EVENT_STATUS,
      );
      const transparency = checkEnum<GoogleCalendarEventTransparency>(
        item.transparency,
        GOOGLE_CALENDAR_EVENT_TRANSPARENCY,
      );
      const visibility = checkEnum<GoogleCalendarEventVisibility>(
        item.visibility,
        GOOGLE_CALENDAR_EVENT_VISIBILITY,
      );

      const selfAttendant = item.attendees?.find((attendee) => attendee.self);

      const attendeeStatus = checkEnum<GoogleCalendarEventAttendantStatus>(
        selfAttendant?.responseStatus,
        GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
      );

      // Other dates
      const createdAt =
        item.created !== null && item.created !== undefined
          ? new Date(item.created)
          : item.created;
      const updatedAt =
        item.updated !== null && item.updated !== undefined
          ? new Date(item.updated)
          : item.updated;

      // Recurrence
      const isRecurring =
        item.recurrence !== undefined &&
        item.recurrence !== null &&
        item.recurrence.length > 0;
      const isRecurringInstance = item.recurringEventId !== undefined;

      const [memoryEvent] = await db
        .select({ memoryId: memoryEventTable.memoryId })
        .from(memoryEventTable)
        .where(
          and(
            eq(memoryEventTable.platformId, item.id),
            eq(memoryEventTable.platformCalendarId, calendarId),
            eq(memoryEventTable.platformAccountId, platformAccountId),
          ),
        );

      const isDeleted = status === "cancelled";

      // If the event is deleted, we need to delete the memory, or not add it
      if (isDeleted && (!item.recurringEventId || !startOriginal)) {
        if (memoryEvent?.memoryId) {
          await db
            .delete(memoryTable)
            .where(eq(memoryTable.id, memoryEvent.memoryId));
        }

        console.log(
          `[ACCOUNT ${platformAccountId}][CALENDAR ${calendarId}][EVENT ${item.id}] Skipping memory upsert because the event is deleted`,
        );

        return {
          memoryId: memoryEvent?.memoryId ?? "NO MEMORY",
          deleted: true,
        };
      }

      // If not deleted, let's continue upserting it.
      let eventData: Exclude<
        Parameters<typeof upsertMemory>[1]["event"],
        undefined
      > = {
        icalUid: item.iCalUID,
        integrationAccountId: context.googleAccount.integrationAccountId,
        platformId: item.id,
        platformCalendarId: platformCalendarId,
        platformAccountId: platformAccountId,
        calendarId: calendarId,
        source: GOOGLE_CALENDAR,
        sequence: item.sequence ?? -1,

        startDate,
        startDateTimeZone: startTimeZone ?? null,
        endDate: end,
        endDateTimeZone: endTimeZone ?? null,
        isFullDay,
        attendenceStatus: attendeeStatus ?? "tentative",
        isOrganizer: item.organizer?.self === true,
        organizerEmail: item.organizer?.email ?? null,
        isCreator: item.creator?.self === true,
        creatorEmail: item.creator?.email ?? null,
        eventType: eventType ?? "default",
        platformData: {
          summary: item.summary ?? "Unspecified",
          description: item.description ?? undefined,
          location: item.location ?? undefined,
          transparency: transparency ?? "opaque",
          visibility: visibility ?? "public",
        },
      };

      if (isRecurring) {
        const rrule = item.recurrence?.join("\n");

        if (rrule) {
          const recurringEnd = getRruleEndDate(rrule, startDate);

          eventData = {
            ...eventData,
            rrule,
            recurringEnd,
          };
        }
      } else if (isRecurringInstance) {
        eventData = {
          ...eventData,
          recurringEventPlatformId: item.recurringEventId,
          startOriginal,
          startOriginalTimeZone: startOriginalTimeZone ?? null,
          deletedInstance: isDeleted,
        };
      }

      // Processing attendees
      if (item.attendees && item.attendees.length > 0) {
        console.log(
          `[ACCOUNT ${platformAccountId}][CALENDAR ${calendarId}][EVENT ${item.id}] Processing attendees`,
        );

        const mapAttendee = (
          attendee: Exclude<
            GoogleCalendarEvent["attendees"],
            undefined
          >[number],
        ): SimpleMemoryEventAttendant | undefined => {
          if (!attendee.email) {
            return undefined;
          }

          const status = checkEnum<GoogleCalendarEventAttendantStatus>(
            attendee.responseStatus,
            GOOGLE_CALENDAR_EVENT_ATTENDANT_STATUS,
          );

          return {
            email: attendee.email,
            displayName: attendee.displayName ?? null,
            comment: attendee.comment ?? null,
            optional: attendee.optional ?? false,
            organizer: attendee.organizer ?? false,
            status: status ?? null,
            platformAttendeeId: attendee.id ?? null,
            self: attendee.self ?? false,
          };
        };

        const processedAttendees = filterUndefined(
          item.attendees.map(mapAttendee),
        );

        eventData.attendees = processedAttendees;
        eventData.attendeesOmitted = item.attendeesOmitted === true;
      }

      const upsertedMemory = await upsertMemory(
        userId,
        {
          source: "CALENDAR",
          content: item.summary ?? "Unspecified",
          description: item.description ?? undefined,
          createdAt: createdAt ?? undefined,
          updatedAt: updatedAt ?? undefined,
          embeddings: false,
          memoryId: memoryEvent?.memoryId ?? undefined,
          event: eventData,
        },
        db,
      );

      if (!upsertedMemory.memoryEventId) {
        throw new Error("Failed to create memory event");
      }

      console.log(
        `[ACCOUNT ${platformAccountId}][CALENDAR ${calendarId}][EVENT ${item.id}] Successfully processed`,
      );

      return { memoryId: upsertedMemory.id, deleted: false };
    } catch (error) {
      console.error(
        `[ACCOUNT ${platformAccountId}][CALENDAR ${calendarId}][EVENT ${item.id}] Error:`,
        error,
      );
      throw error;
    }
  }

  async syncEvents(
    integrationAccountId: string,
    calendarId: string,
  ): Promise<void> {
    const upsertedEvents = new Set<string>();

    return withGoogleAccount(
      integrationAccountId,
      GOOGLE_CALENDAR,
      async (googleAccount) =>
        syncCalendarEvents(
          googleAccount,
          calendarId,
          async (tx, items) => {
            const newUpsertedEvents = await Promise.all(
              items.map((item) =>
                this.processEvent(
                  {
                    userId: googleAccount.userId,
                    platformAccountId: googleAccount.platformAccountId,
                    platformCalendarId: calendarId,
                    calendarId,
                    integrationAccountId: googleAccount.integrationAccountId,
                    googleAccount,
                  },
                  item,
                  tx,
                ),
              ),
            );

            for (const event of newUpsertedEvents) {
              if (!event.deleted) {
                upsertedEvents.add(event.memoryId);
              }
            }
          },
          async () => {
            // Publishing embeddings fulfill of upserted memories
            await Promise.all(
              Array.from(upsertedEvents).map((memoryId) =>
                publish(FULFILL_EMBEDDING_QUEUE, {
                  userId: googleAccount.userId,
                  memoryId,
                }),
              ),
            );
          },
        ),
    );
  }

  async deleteIntegrationAccount(integrationAccountId: string): Promise<void> {
    const watchers = await db
      .select()
      .from(externalGoogleCalendarEventsWatchersTable)
      .where(
        eq(
          externalGoogleCalendarEventsWatchersTable.integrationAccountId,
          integrationAccountId,
        ),
      );

    await withGoogleAccount(
      integrationAccountId,
      GOOGLE_CALENDAR,
      async (googleAccount) => {
        await Promise.all([
          ...watchers.map((watcher) =>
            stopWatchingCalendarEvents(googleAccount, watcher.calendarId),
          ),
          stopWatchingCalendarList(googleAccount),
        ]);
      },
    );
  }

  async createEvent(
    integrationAccountId: string,
    calendarId: string,
    eventData: SupportedEventFields,
  ): Promise<{ memoryId: string }> {
    const createdEvent = await withGoogleAccount(
      integrationAccountId,
      GOOGLE_CALENDAR,
      async (googleAccount) => {
        const [calendar] = await db
          .select()
          .from(calendarTable)
          .where(
            and(
              eq(calendarTable.id, calendarId),
              eq(calendarTable.userId, googleAccount.userId),
            ),
          );

        if (!calendar) {
          throw new Error("Calendar not found");
        }

        const upsertedEvent = await createCalendarEvent(
          googleAccount,
          calendar.platformCalendarId,
          {
            summary: eventData.summary,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            timezone: eventData.timezone,
            isFullDay: eventData.isFullDay,
            recurrence: eventData.recurrence
              ? [eventData.recurrence]
              : undefined,
            selfAttendance: eventData.selfAttendance,
            eventType: eventData.eventType,
          },
        );

        return this.processEvent(
          {
            userId: googleAccount.userId,
            platformAccountId: googleAccount.platformAccountId,
            platformCalendarId: calendar.platformCalendarId,
            calendarId,
            integrationAccountId: googleAccount.integrationAccountId,
            googleAccount,
          },
          upsertedEvent,
          db,
        );
      },
    );

    return { memoryId: createdEvent.memoryId };
  }

  async updateEvent(
    integrationAccountId: string,
    memoryId: string,
    eventData: Modifiable<SupportedEventFields>,
    recurrenceModifier?: RecurrenceModifierEventInfo,
  ): Promise<void> {
    await withGoogleAccount(
      integrationAccountId,
      GOOGLE_CALENDAR,
      async (googleAccount) => {
        const eventsToUpdate: GoogleCalendarEvent[] = [];

        const [memory] = await getMemories(googleAccount.userId, [memoryId]);

        if (!memory) {
          throw new Error("Memory not found");
        }

        if (!memory.event || !memory.calendar) {
          throw new Error("Memory is not an event");
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (memory.event.source !== GOOGLE_CALENDAR) {
          throw new Error("Memory is not a Google Calendar event");
        }

        if (recurrenceModifier) {
          //! START OF DUPLICATED CODE
          const isRecurring = isRecurringEvent(memory);
          let isRecurringInstance = isRecurringInstanceEvent(memory);

          if (
            !isRecurringInstance &&
            !isRecurring &&
            !recurrenceModifier.virtualStartDate
          ) {
            throw new Error("Memory is not a recurring event");
          }

          let memoryEvent = memory.event;

          if (recurrenceModifier.virtualStartDate) {
            const virtualDayStart = new Date(
              recurrenceModifier.virtualStartDate,
            );
            virtualDayStart.setHours(0, 0, 0, 0);

            const virtualDayEnd = new Date(virtualDayStart);
            virtualDayEnd.setHours(23, 59, 59, 999);

            const [existingInstance] = await db
              .select()
              .from(memoryEventTable)
              .where(
                and(
                  eq(memoryEventTable.platformId, memory.event.platformId),
                  gte(memoryEventTable.startDate, virtualDayStart),
                  lte(memoryEventTable.startDate, virtualDayEnd),
                ),
              );

            if (existingInstance) {
              isRecurringInstance = true;
              memoryEvent = existingInstance;
            } else {
              // We just update the update values. With this method we might have trouble with DST. We've solved this on the App. Might be worth making this common.
              const diff =
                memory.event.endDate.getTime() -
                memory.event.startDate.getTime();
              const virtualStartDate = new Date(
                recurrenceModifier.virtualStartDate,
              );
              const virtualEndDate = new Date(
                virtualStartDate.getTime() + diff,
              );

              const eventDataStartDiff = eventData.startDate
                ? eventData.startDate.getTime() -
                  memory.event.startDate.getTime()
                : 0;
              const eventDataEndDiff = eventData.endDate
                ? eventData.endDate.getTime() - memory.event.endDate.getTime()
                : 0;

              eventData.startDate = new Date(
                virtualStartDate.getTime() + eventDataStartDiff,
              );
              eventData.endDate = new Date(
                virtualEndDate.getTime() + eventDataEndDiff,
              );
            }
          }

          //! STOP OF DUPLICATED CODE

          switch (recurrenceModifier.type) {
            case "ALL":
              {
                {
                  // Since it's all, we just update all. No need to do per instance checks.
                  // We just need to handle a bit different if it's a recurring instance, since we have to update the parent and the instance to the same values.
                  const updatedRecurringEvent = await mutateCalendarEvent(
                    googleAccount,
                    memory.calendar.platformCalendarId,
                    isRecurringInstance
                      ? (memoryEvent.recurringEventPlatformId ??
                          memoryEvent.platformId)
                      : memoryEvent.platformId,
                    autofillEventData(memory, memoryEvent, eventData),
                  );

                  eventsToUpdate.push(updatedRecurringEvent);

                  if (isRecurringInstance) {
                    const updatedInstance = await mutateCalendarEvent(
                      googleAccount,
                      memory.calendar.platformCalendarId,
                      memoryEvent.platformId,
                      autofillEventData(memory, memoryEvent, eventData),
                    );

                    eventsToUpdate.push(updatedInstance);
                  }
                }
              }
              break;
            case "THIS_AND_FOLLOWING":
              {
                let updatedEvents: GoogleCalendarEvent[] = [];

                const recurringEventId = isRecurringInstance
                  ? memoryEvent.recurringEventPlatformId
                  : memoryEvent.platformId;
                const followUpEventId = isRecurringInstance
                  ? memoryEvent.platformId
                  : undefined;

                if (!recurringEventId) {
                  throw new Error("Recurring event id not found");
                }

                updatedEvents =
                  await mutateRecurrentCalendarEventThisAndFollowing(
                    googleAccount,
                    memoryEvent.platformCalendarId,
                    recurringEventId,
                    autofillEventData(memory, memoryEvent, eventData),
                    followUpEventId,
                  );

                eventsToUpdate.push(...updatedEvents);
              }
              break;
            case "INSTANCE":
              {
                if (isRecurringInstance) {
                  const updatedEvent = await mutateCalendarEvent(
                    googleAccount,
                    memory.calendar.platformCalendarId,
                    memoryEvent.platformId,
                    autofillEventData(memory, memoryEvent, eventData),
                  );

                  eventsToUpdate.push(updatedEvent);
                } else {
                  const updatedEvent =
                    await mutateCalendarEventRecurrenceInstance(
                      googleAccount,
                      memory.calendar.platformCalendarId,
                      memoryEvent.platformId,
                      autofillEventData(memory, memoryEvent, eventData),
                    );

                  eventsToUpdate.push(updatedEvent);
                }
              }
              break;
          }
        } else {
          const updatedEvent = await mutateCalendarEvent(
            googleAccount,
            memory.calendar.platformCalendarId,
            memory.event.platformId,
            autofillEventData(memory, memory.event, eventData),
          );

          eventsToUpdate.push(updatedEvent);
        }

        const calendarId = memory.calendar.id;
        const platformCalendarId = memory.calendar.platformCalendarId;

        await Promise.all(
          eventsToUpdate.map((event) =>
            this.processEvent(
              {
                userId: googleAccount.userId,
                platformAccountId: googleAccount.platformAccountId,
                platformCalendarId,
                calendarId,
                integrationAccountId: googleAccount.integrationAccountId,
                googleAccount,
              },
              event,
              db,
            ),
          ),
        );
      },
    );
  }

  async deleteEvent(
    integrationAccountId: string,
    memoryId: string,
    recurrenceModifier?: RecurrenceModifierEventInfo,
  ): Promise<void> {
    await withGoogleAccount(
      integrationAccountId,
      GOOGLE_CALENDAR,
      async (googleAccount) => {
        const [memory] = await getMemories(googleAccount.userId, [memoryId]);

        if (!memory) {
          throw new Error("Memory not found");
        }

        if (!memory.event || !memory.calendar) {
          throw new Error("Memory is not an event");
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (memory.event.source !== GOOGLE_CALENDAR) {
          throw new Error("Memory is not a Google Calendar event");
        }

        let eventToDelete = memory.event.platformId;

        if (recurrenceModifier) {
          // TODO: Verify this (in the logic side, and in the google calendar side)
          //! START OF DUPLICATED CODE
          let isRecurring = isRecurringEvent(memory);
          let isRecurringInstance = isRecurringInstanceEvent(memory);
          let isVirtual = recurrenceModifier.virtualStartDate !== undefined;

          if (
            !isRecurringInstance &&
            !isRecurring &&
            !recurrenceModifier.virtualStartDate
          ) {
            throw new Error("Memory is not a recurring event");
          }

          let memoryEvent = memory.event;

          if (recurrenceModifier.virtualStartDate) {
            const virtualDayStart = new Date(
              recurrenceModifier.virtualStartDate,
            );
            virtualDayStart.setHours(0, 0, 0, 0);

            const virtualDayEnd = new Date(virtualDayStart);
            virtualDayEnd.setHours(23, 59, 59, 999);

            const [existingInstance] = await db
              .select()
              .from(memoryEventTable)
              .where(
                and(
                  eq(memoryEventTable.platformId, memory.event.platformId),
                  gte(memoryEventTable.startDate, virtualDayStart),
                  lte(memoryEventTable.startDate, virtualDayEnd),
                ),
              );

            if (existingInstance) {
              isVirtual = false;
              isRecurringInstance =
                existingInstance.recurringEventPlatformId !== null;
              isRecurring = existingInstance.recurringEventPlatformId === null;
              memoryEvent = existingInstance;
            }
          }
          //! STOP OF DUPLICATED CODE

          switch (recurrenceModifier.type) {
            case "ALL":
              {
                eventToDelete =
                  memory.event.recurringEventPlatformId ?? eventToDelete;
              }
              break;
            case "INSTANCE":
              {
                if (isVirtual && recurrenceModifier.virtualStartDate) {
                  const instance = await fetchRecurringInstance(
                    googleAccount,
                    memory.calendar.platformCalendarId,
                    memory.event.platformId,
                    recurrenceModifier.virtualStartDate,
                  );

                  if (!instance?.id) {
                    throw new Error("Instance not found");
                  }

                  eventToDelete = instance.id;
                } else if (isRecurring) {
                  const instance = await fetchRecurringInstance(
                    googleAccount,
                    memory.calendar.platformCalendarId,
                    memory.event.platformId,
                    memory.event.startDate,
                  );

                  if (!instance?.id) {
                    throw new Error("Instance not found");
                  }

                  eventToDelete = instance.id;
                }
              }
              break;
            case "THIS_AND_FOLLOWING":
              {
                if (isVirtual && recurrenceModifier.virtualStartDate) {
                  // TODO
                  throw new Error("Not implemented");
                }

                if (
                  isRecurringInstance &&
                  memoryEvent.recurringEventPlatformId
                ) {
                  // TODO: Verify this (in the logic side, and in the google calendar side)
                  const [parentEvent] = await db
                    .select()
                    .from(memoryEventTable)
                    .where(
                      and(
                        eq(
                          memoryEventTable.platformId,
                          memoryEvent.recurringEventPlatformId,
                        ),
                        eq(
                          memoryEventTable.platformAccountId,
                          googleAccount.platformAccountId,
                        ),
                        eq(memoryEventTable.calendarId, memory.calendar.id),
                      ),
                    );

                  if (!parentEvent) {
                    throw new Error("Parent event not found");
                  }

                  if (!parentEvent.rrule) {
                    throw new Error("Parent event does not have a recurrence");
                  }

                  const originalRrule = parentEvent.rrule;

                  const newRrule = applyUntilToRrule(
                    parentEvent.rrule,
                    parentEvent.startDate,
                    memoryEvent.startDate,
                  );

                  const [limitedEvent, originalEvent] = await Promise.all([
                    mutateCalendarEvent(
                      googleAccount,
                      memory.calendar.platformCalendarId,
                      parentEvent.platformId,
                      autofillEventData(memory, parentEvent, {
                        summary: undefined,
                        startDate: undefined,
                        endDate: undefined,
                        timezone: undefined,
                        isFullDay: undefined,
                        recurrence: newRrule,
                      }),
                    ),
                    mutateCalendarEvent(
                      googleAccount,
                      memory.calendar.platformCalendarId,
                      memoryEvent.platformId,
                      autofillEventData(memory, memoryEvent, {
                        summary: undefined,
                        startDate: undefined,
                        endDate: undefined,
                        timezone: undefined,
                        isFullDay: undefined,
                        recurrence: originalRrule,
                      }),
                    ),
                  ]);

                  await this.processEvent(
                    {
                      userId: googleAccount.userId,
                      platformAccountId: googleAccount.platformAccountId,
                      platformCalendarId: memory.calendar.platformCalendarId,
                      calendarId: memory.calendar.id,
                      integrationAccountId: googleAccount.integrationAccountId,
                      googleAccount,
                    },
                    originalEvent,
                    db,
                  );

                  await this.processEvent(
                    {
                      userId: googleAccount.userId,
                      platformAccountId: googleAccount.platformAccountId,
                      platformCalendarId: memory.calendar.platformCalendarId,
                      calendarId: memory.calendar.id,
                      integrationAccountId: googleAccount.integrationAccountId,
                      googleAccount,
                    },
                    limitedEvent,
                    db,
                  );
                }
              }
              break;
          }
        }

        await deleteCalendarEvent(
          googleAccount,
          memory.calendar.id,
          eventToDelete,
        );
      },
    );
  }
}
