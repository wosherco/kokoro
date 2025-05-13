import { TZDate, tz } from "@date-fns/tz";
import { GaxiosError } from "gaxios";
import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import { nanoid } from "nanoid";

import { isGoogleCalendarHolidays } from "@kokoro/common";
import { and, eq, exists } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db as dbClient } from "@kokoro/db/client";
import {
  calendarTable,
  externalGoogleCalendarEventsWatchersTable,
  externalGoogleCalendarListWatchersTable,
  integrationsAccountsTable,
  memoryEventTable,
  memoryTable,
} from "@kokoro/db/schema";
import { applyUntilToRrule } from "@kokoro/rrule";
import type { Callback } from "@kokoro/validators";
import type {
  GoogleCalendarEventAttendantStatus,
  GoogleCalendarEventType,
} from "@kokoro/validators/db";

import { env } from "../env";
import type { GoogleAccount } from "./index";
import { checkDate } from "./utils";

export type GoogleCalendarListEntry = calendar_v3.Schema$CalendarListEntry;

export type GoogleCalendarEventDate = calendar_v3.Schema$EventDateTime;

export type GoogleCalendarEvent = calendar_v3.Schema$Event;

export async function syncCalendarList(
  googleAccount: GoogleAccount,
  /**
   * Will be called for each batch of entries.
   */
  processEntries: (
    tx: TransactableDBType,
    entries: GoogleCalendarListEntry[],
  ) => Promise<Callback[] | undefined | void>,
) {
  const {
    oauth2Client: googleClient,
    platformAccountId,
    integrationAccountId,
  } = googleAccount;
  const callbacks: Callback[] = [];

  await dbClient.transaction(async (tx) => {
    console.log(`[ACCOUNT ${platformAccountId}] Syncing calendar list`);
    const calendar = google.calendar({ version: "v3", auth: googleClient });

    const recursiveSync = async (
      syncToken?: string,
      nextPageToken?: string,
    ) => {
      console.log(
        `[ACCOUNT ${platformAccountId}] Fetching calendar list | Token: ${syncToken} | Page: ${nextPageToken}`,
      );

      // biome-ignore lint/suspicious/noImplicitAnyLet: type is inferred after the try block
      let response;

      try {
        response = await calendar.calendarList.list({
          // Default is 100, max is 250
          maxResults: 250,
          showDeleted: true,
          showHidden: true,
          syncToken,
          pageToken: nextPageToken,
        });
      } catch (error) {
        if (error instanceof GaxiosError && error.response?.status === 410) {
          console.log(
            `[ACCOUNT ${platformAccountId}] Sync token expired, performing full sync`,
          );
          // equals to GONE, we need to re-sync the entire calendar list

          await tx
            .delete(calendarTable)
            .where(
              eq(calendarTable.integrationAccountId, integrationAccountId),
            );

          return recursiveSync();
        }

        throw error;
      }

      const returnedCallbacks = await processEntries(
        tx,
        response.data.items ?? [],
      );

      if (returnedCallbacks) {
        callbacks.push(...returnedCallbacks);
      }

      if (response.data.nextPageToken) {
        return recursiveSync(syncToken, response.data.nextPageToken);
      }

      if (response.data.nextSyncToken) {
        await googleAccount.tx
          .update(integrationsAccountsTable)
          .set({
            platformData: {
              syncToken: response.data.nextSyncToken,
              lastSynced: new Date().toISOString(),
            },
          })
          .where(eq(integrationsAccountsTable.id, integrationAccountId));

        return;
      }

      // Either nextPageToken or nextSyncToken are in the response. This should never happen
      throw new Error("No next sync token found");
    };

    return recursiveSync(googleAccount.platformData?.syncToken);
  });

  await Promise.all(callbacks.map((callback) => callback()));
}

export async function syncCalendarEvents(
  googleAccount: GoogleAccount,
  calendarId: string,
  /**
   * Will be called for each batch of entries.
   */
  processEntries: (
    tx: TransactableDBType,
    entries: GoogleCalendarEvent[],
  ) => Promise<void>,
  /**
   * Will be called when the sync is complete.
   */
  onComplete?: (tx: TransactableDBType) => Promise<void>,
) {
  const { platformAccountId: accountId } = googleAccount;

  console.log(`[ACCOUNT ${accountId}][CALENDAR ${calendarId}] Starting sync`);

  await dbClient.transaction(async (tx) => {
    const { oauth2Client: googleClient } = googleAccount;

    console.log(
      `[ACCOUNT ${accountId}][CALENDAR ${calendarId}] Fetching calendar details`,
    );
    const [calendarDetails] = await tx
      .select({
        syncToken: calendarTable.eventsSyncToken,
        userId: calendarTable.userId,
        platformCalendarId: calendarTable.platformCalendarId,
      })
      .from(calendarTable)
      .where(
        and(
          eq(calendarTable.platformAccountId, accountId),
          eq(calendarTable.id, calendarId),
        ),
      );

    if (!calendarDetails) {
      console.error(
        `[ACCOUNT ${accountId}][CALENDAR ${calendarId}] Calendar not found`,
      );
      throw new Error("Calendar not found");
    }

    const calendar = google.calendar({ version: "v3", auth: googleClient });

    const recursiveSync = async (
      syncToken?: string,
      nextPageToken?: string,
    ): Promise<void> => {
      console.log(
        `[ACCOUNT ${accountId}][CALENDAR ${calendarId}] Fetching events batch | Token: ${syncToken} | Page: ${nextPageToken}`,
      );

      const payload = {
        // Default is 250, max is 2500
        maxResults: 1000,
        showDeleted: true,
        singleEvents: false,
        calendarId: calendarDetails.platformCalendarId,
        syncToken,
        pageToken: nextPageToken,
      };

      // biome-ignore lint/suspicious/noImplicitAnyLet: type is inferred after the try block
      let response;
      try {
        response = await calendar.events.list(payload);
      } catch (error) {
        if (error instanceof GaxiosError && error.response?.status === 410) {
          console.log(
            `[ACCOUNT ${accountId}][CALENDAR ${calendarId}] Sync token expired, performing full sync`,
          );
          // equals to GONE, we need to re-sync the entire calendar events

          const memoryEvents = tx.$with("memory_events").as(
            tx
              .select({ memoryId: memoryEventTable.memoryId })
              .from(memoryEventTable)
              .where(
                and(
                  eq(memoryEventTable.platformAccountId, accountId),
                  eq(memoryEventTable.calendarId, calendarId),
                ),
              ),
          );

          await tx
            .with(memoryEvents)
            .delete(memoryTable)
            .where(
              exists(
                tx
                  .select()
                  .from(memoryEvents)
                  .where(eq(memoryEvents.memoryId, memoryTable.id)),
              ),
            );

          return recursiveSync();
        }

        throw error;
      }

      console.log(
        `[ACCOUNT ${accountId}][CALENDAR ${calendarId}] Processing ${response.data.items?.length} events`,
      );

      await processEntries(tx, response.data.items ?? []);

      if (
        response.data.nextPageToken !== undefined &&
        response.data.nextPageToken !== null
      ) {
        return recursiveSync(syncToken, response.data.nextPageToken);
      }

      if (
        response.data.nextSyncToken !== undefined &&
        response.data.nextSyncToken !== null
      ) {
        await tx
          .update(calendarTable)
          .set({
            eventsSyncToken: response.data.nextSyncToken,
            lastSynced: new Date(),
          })
          .where(
            and(
              eq(calendarTable.id, calendarId),
              eq(calendarTable.platformAccountId, accountId),
            ),
          );

        return;
      }

      // Either nextPageToken or nextSyncToken are in the response. This should never happen
      throw new Error("No next sync token found");
    };

    // Syncing just events
    await recursiveSync(calendarDetails.syncToken ?? undefined);

    if (onComplete) {
      await onComplete(tx);
    }
  });
}

export interface BaseGoogleCalendarEventCompatibleValues {
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  isFullDay: boolean;
  recurrence?: string[];
  selfAttendance?: Partial<{
    status: GoogleCalendarEventAttendantStatus;
    comment: string | null;
  }>;
}

export interface InsertGoogleCalendarEventCompatibleValues
  extends BaseGoogleCalendarEventCompatibleValues {
  eventType?: GoogleCalendarEventType;
}

function correctDates(
  startDate?: Date,
  endDate?: Date,
  isFullDay = false,
  overrideTimeZone?: string,
): Pick<GoogleCalendarEvent, "start" | "end"> {
  const finalObj: Pick<GoogleCalendarEvent, "start" | "end"> = {};

  let timezonedStartDate = startDate ? new TZDate(startDate) : undefined;
  let timezonedEndDate = endDate ? new TZDate(endDate) : undefined;

  if (overrideTimeZone) {
    const convert = tz(overrideTimeZone);
    if (timezonedStartDate) {
      timezonedStartDate = convert(timezonedStartDate);
    }

    if (timezonedEndDate) {
      timezonedEndDate = convert(timezonedEndDate);
    }
  }

  if (isFullDay) {
    if (timezonedStartDate) {
      finalObj.start = {
        date: timezonedStartDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
        timeZone: timezonedStartDate.timeZone,
      };
    }

    if (timezonedEndDate) {
      finalObj.end = {
        date: timezonedEndDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
        timeZone: timezonedEndDate.timeZone,
      };
    }
  } else {
    if (timezonedStartDate) {
      finalObj.start = {
        dateTime: timezonedStartDate.toISOString(),
        timeZone: timezonedStartDate.timeZone,
      };
    }

    if (timezonedEndDate) {
      finalObj.end = {
        dateTime: timezonedEndDate.toISOString(),
        timeZone: timezonedEndDate.timeZone,
      };
    }
  }

  return finalObj;
}

export async function createCalendarEvent(
  googleAccount: GoogleAccount,
  platformCalendarId: string,
  options: InsertGoogleCalendarEventCompatibleValues,
) {
  const { oauth2Client: googleClient } = googleAccount;
  const calendar = google.calendar({ version: "v3", auth: googleClient });

  const event = await calendar.events.insert({
    calendarId: platformCalendarId,
    requestBody: {
      summary: options.summary,
      description: options.description,
      ...correctDates(
        options.startDate,
        options.endDate,
        options.isFullDay,
        options.timezone,
      ),
      recurrence: options.recurrence,
      attendees: options.selfAttendance
        ? [
            {
              self: true,
              responseStatus: options.selfAttendance.status,
              comment: options.selfAttendance.comment,
            },
          ]
        : undefined,
      eventType: options.eventType,
    },
  });

  if (event.status !== 200) {
    throw new Error(`Failed to create event: ${event.status}`);
  }

  return event.data;
}

export async function mutateCalendarEvent(
  googleAccount: GoogleAccount,
  calendarId: string,
  eventId: string,
  updateValues: BaseGoogleCalendarEventCompatibleValues,
) {
  const { oauth2Client: googleClient } = googleAccount;
  const calendar = google.calendar({ version: "v3", auth: googleClient });
  const event = await calendar.events.get({
    calendarId,
    eventId,
  });

  if (event.status !== 200) {
    throw new Error("Failed to get event");
  }

  const payload = event.data;

  const mutateResponse = await calendar.events.update({
    eventId,
    calendarId,
    requestBody: {
      ...payload,
      summary: updateValues.summary,
      description: updateValues.description,
      ...correctDates(
        updateValues.startDate,
        updateValues.endDate,
        updateValues.isFullDay,
        updateValues.timezone,
      ),
      recurrence: updateValues.recurrence,
      attendees: updateValues.selfAttendance
        ? [
            {
              self: true,
              responseStatus: updateValues.selfAttendance.status,
              comment: updateValues.selfAttendance.comment,
            },
          ]
        : undefined,
    },
  });

  if (mutateResponse.status !== 200) {
    throw new Error("Failed to update event");
  }

  return mutateResponse.data;
}

/**
 * @param followUpEvent If provided, this event will be the follow up event, instead of creating a new one
 */
export async function mutateRecurrentCalendarEventThisAndFollowing(
  googleAccount: GoogleAccount,
  calendarId: string,
  eventId: string,
  updateValues: BaseGoogleCalendarEventCompatibleValues,
  followUpEvent?: string,
) {
  const { oauth2Client: googleClient } = googleAccount;
  const calendar = google.calendar({ version: "v3", auth: googleClient });
  const event = await calendar.events.get({
    calendarId,
    eventId,
  });

  if (event.status !== 200) {
    throw new Error("Failed to get event");
  }

  const payload = event.data;

  const originalRecurrence = payload.recurrence;
  const recurrence = originalRecurrence?.join("\n");

  if (!recurrence) {
    throw new Error("Recurrence not found");
  }

  const { date: startDate } = checkDate(payload.start);

  if (!startDate) {
    throw new Error("Start date not found");
  }

  // Modify rrule to include until
  const rrule = applyUntilToRrule(
    recurrence,
    startDate,
    updateValues.startDate,
  );

  // Applying new RRULE
  payload.recurrence = rrule.split("\n");

  const mutateResponse = await calendar.events.update({
    eventId,
    calendarId,
    requestBody: payload,
  });

  if (mutateResponse.status !== 200) {
    throw new Error("Failed to update event");
  }

  console.log("DEBUG4", followUpEvent);

  let newEvent: GoogleCalendarEvent;
  if (followUpEvent) {
    newEvent = await mutateCalendarEvent(
      googleAccount,
      calendarId,
      followUpEvent,
      updateValues,
    );
  } else {
    newEvent = await createCalendarEvent(
      googleAccount,
      calendarId,
      updateValues,
    );
  }

  return [mutateResponse.data, newEvent];
}

const getFullDayTime = (date: Date) => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate,
    endDate,
  };
};

export async function fetchRecurringInstance(
  googleAccount: GoogleAccount,
  calendarId: string,
  eventId: string,
  queryStartDate: Date,
) {
  const calendar = google.calendar({
    version: "v3",
    auth: googleAccount.oauth2Client,
  });

  const { startDate, endDate } = getFullDayTime(queryStartDate);

  const event = await calendar.events.instances({
    calendarId,
    eventId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
  });

  if (event.status !== 200) {
    throw new Error("Failed to get event instances");
  }

  const instances = event.data.items;

  if (!instances || instances.length === 0) {
    throw new Error("No instances found");
  }

  if (instances.length > 1) {
    throw new Error("More than one instance found");
  }

  return instances[0];
}

export async function mutateCalendarEventRecurrenceInstance(
  googleAccount: GoogleAccount,
  calendarId: string,
  eventId: string,
  updateValues: BaseGoogleCalendarEventCompatibleValues,
) {
  const instance = await fetchRecurringInstance(
    googleAccount,
    calendarId,
    eventId,
    updateValues.startDate,
  );

  if (!instance?.id) {
    throw new Error("Instance not found");
  }

  return mutateCalendarEvent(
    googleAccount,
    calendarId,
    instance.id,
    updateValues,
  );
}

/**
 * Deletes a calendar event. DOES NOT DELETE EVENT FROM DB.
 */
export async function deleteCalendarEvent(
  googleAccount: GoogleAccount,
  platformCalendarId: string,
  platformEventId: string,
) {
  const { oauth2Client: googleClient } = googleAccount;
  const calendar = google.calendar({ version: "v3", auth: googleClient });

  await calendar.events.delete({
    calendarId: platformCalendarId,
    eventId: platformEventId,
  });
}

/**
 * Moves a calendar event to a new calendar. DOES NOT DELETE EVENT FROM DB.

 * @returns The new event data.
 */
export async function moveCalendarEvent(
  googleAccount: GoogleAccount,
  calendarId: string,
  eventId: string,
  newCalendarId: string,
) {
  const { oauth2Client: googleClient } = googleAccount;
  const calendar = google.calendar({ version: "v3", auth: googleClient });

  const newEvent = await calendar.events.move({
    calendarId,
    eventId,
    destination: newCalendarId,
  });

  return newEvent.data;
}

export async function watchCalendarList(
  googleAccount: GoogleAccount,
  initialDb: TransactableDBType = dbClient,
) {
  const {
    oauth2Client: googleClient,
    platformAccountId: accountId,
    userId,
  } = googleAccount;
  console.log(
    `[Google Calendar List Watch] Starting watch for account ${accountId}`,
  );

  const [existingWatcher] = await initialDb
    .select()
    .from(externalGoogleCalendarListWatchersTable)
    .where(
      and(
        eq(externalGoogleCalendarListWatchersTable.userId, userId),
        eq(
          externalGoogleCalendarListWatchersTable.integrationAccountId,
          googleAccount.integrationAccountId,
        ),
      ),
    );

  if (existingWatcher) {
    console.log(
      `[Google Calendar List Watch] Already watching for account ${accountId}`,
    );

    return;
  }

  const calendar = google.calendar({ version: "v3", auth: googleClient });

  const secret = nanoid(40);
  const url = `${
    env.NGROK_URL ? `https://${env.NGROK_URL}` : env.PUBLIC_API_URL
  }/watch/google-calendar/calendarlist`;
  const expiryDate = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);

  await initialDb.transaction(async (tx) => {
    const [watcher] = await tx
      .insert(externalGoogleCalendarListWatchersTable)
      .values({
        userId,
        integrationAccountId: googleAccount.integrationAccountId,
        secret,
        expiryDate,
      })
      .returning({
        id: externalGoogleCalendarListWatchersTable.id,
      });

    if (!watcher) {
      throw new Error("Failed to create watcher");
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: type is inferred after the try block
    let req;

    try {
      req = await calendar.calendarList.watch({
        requestBody: {
          id: watcher.id,
          type: "web_hook",
          token: secret,
          address: url,
        },
      });
    } catch (e) {
      console.error(
        `[Google Calendar List Watch] Failed for account ${accountId}:`,
        e,
      );
      throw e;
    }

    const resourceId = req.data.resourceId;

    if (!resourceId) {
      throw new Error("Resource ID not found");
    }

    await tx
      .update(externalGoogleCalendarListWatchersTable)
      .set({
        resourceId,
      })
      .where(eq(externalGoogleCalendarListWatchersTable.id, watcher.id));
  });
}

export async function stopWatchingCalendarList(
  googleAccount: GoogleAccount,
  initialDb: TransactableDBType = dbClient,
) {
  const {
    oauth2Client: googleClient,
    platformAccountId: accountId,
    userId,
  } = googleAccount;
  console.log(
    `[Google Calendar List Watch] Stopping watch for account ${accountId}`,
  );

  const calendar = google.calendar({ version: "v3", auth: googleClient });

  await initialDb.transaction(async (tx) => {
    const [watcher] = await tx
      .delete(externalGoogleCalendarListWatchersTable)
      .where(
        and(
          eq(externalGoogleCalendarListWatchersTable.userId, userId),
          eq(
            externalGoogleCalendarListWatchersTable.integrationAccountId,
            googleAccount.integrationAccountId,
          ),
        ),
      )
      .returning({
        id: externalGoogleCalendarListWatchersTable.id,
        resourceId: externalGoogleCalendarListWatchersTable.resourceId,
      });

    if (!watcher) {
      throw new Error("Watcher not found");
    }

    if (!watcher.resourceId) {
      throw new Error("Watcher resourceId not found");
    }

    await calendar.channels.stop({
      requestBody: {
        id: watcher.id,
        resourceId: watcher.resourceId,
      },
    });
  });
}

export async function watchCalendarEvents(
  googleAccount: GoogleAccount,
  platformCalendarId: string,
  initialDb: TransactableDBType = dbClient,
) {
  if (isGoogleCalendarHolidays(platformCalendarId)) {
    console.log(
      `[Google Calendar Events Watch] Calendar ${platformCalendarId} is a holidays calendar, skipping`,
    );

    return;
  }

  const {
    platformAccountId: accountId,
    userId,
    oauth2Client: googleClient,
  } = googleAccount;
  console.log(
    `[Google Calendar Events Watch] Starting watch for account ${accountId}, calendar ${platformCalendarId}`,
  );

  const [existingWatcher] = await initialDb
    .select()
    .from(externalGoogleCalendarEventsWatchersTable)
    .where(
      and(
        eq(externalGoogleCalendarEventsWatchersTable.userId, userId),
        eq(
          externalGoogleCalendarEventsWatchersTable.integrationAccountId,
          googleAccount.integrationAccountId,
        ),
        eq(
          externalGoogleCalendarEventsWatchersTable.calendarId,
          platformCalendarId,
        ),
      ),
    );

  if (existingWatcher) {
    console.log(
      `[Google Calendar Events Watch] Already watching for account ${accountId}, calendar ${platformCalendarId}`,
    );
    return;
  }

  const calendar = google.calendar({ version: "v3", auth: googleClient });
  const secret = nanoid(40);
  const url = `${
    env.NGROK_URL ? `https://${env.NGROK_URL}` : env.PUBLIC_API_URL
  }/watch/google-calendar/events`;
  const expiryDate = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);

  await initialDb.transaction(async (tx) => {
    const [watcher] = await tx
      .insert(externalGoogleCalendarEventsWatchersTable)
      .values({
        userId,
        integrationAccountId: googleAccount.integrationAccountId,
        calendarId: platformCalendarId,
        secret,
        expiryDate,
      })
      .returning({
        id: externalGoogleCalendarEventsWatchersTable.id,
      });

    if (!watcher) {
      throw new Error("Failed to create watcher");
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: type is inferred after the try block
    let req;

    try {
      req = await calendar.events.watch({
        calendarId: platformCalendarId,
        requestBody: {
          id: watcher.id,
          type: "web_hook",
          token: secret,
          address: url,
        },
      });
    } catch (e) {
      if (e instanceof GaxiosError) {
        const isNotSupportedError = e.response?.data?.error?.errors?.some(
          // biome-ignore lint/suspicious/noExplicitAny: idk
          (err: any) => err.reason === "pushNotSupportedForRequestedResource",
        ) as boolean;

        if (isNotSupportedError) {
          await tx
            .delete(externalGoogleCalendarEventsWatchersTable)
            .where(
              eq(externalGoogleCalendarEventsWatchersTable.id, watcher.id),
            );

          console.log(
            `[Google Calendar List Watch] Calendar ${accountId} is not watchable`,
          );

          return;
        }
      }

      console.error(
        `[Google Calendar List Watch] Failed for account ${accountId}:`,
        e,
      );
      throw e;
    }

    const resourceId = req.data.resourceId;

    if (!resourceId) {
      throw new Error("Resource ID not found");
    }

    await tx
      .update(externalGoogleCalendarEventsWatchersTable)
      .set({
        resourceId,
      })
      .where(eq(externalGoogleCalendarEventsWatchersTable.id, watcher.id));
  });
}

export async function stopWatchingCalendarEvents(
  googleAccount: GoogleAccount,
  calendarId: string,
  initialDb: TransactableDBType = dbClient,
) {
  const {
    oauth2Client: googleClient,
    platformAccountId: accountId,
    userId,
  } = googleAccount;
  console.log(
    `[Google Calendar Events Watch] Stopping watch for account ${accountId}, calendar ${calendarId}`,
  );

  const calendar = google.calendar({ version: "v3", auth: googleClient });

  await initialDb.transaction(async (tx) => {
    const [watcher] = await tx
      .delete(externalGoogleCalendarEventsWatchersTable)
      .where(
        and(
          eq(externalGoogleCalendarEventsWatchersTable.userId, userId),
          eq(
            externalGoogleCalendarEventsWatchersTable.integrationAccountId,
            googleAccount.integrationAccountId,
          ),
          eq(externalGoogleCalendarEventsWatchersTable.calendarId, calendarId),
        ),
      )
      .returning({
        id: externalGoogleCalendarEventsWatchersTable.id,
        resourceId: externalGoogleCalendarEventsWatchersTable.resourceId,
      });

    if (!watcher) {
      throw new Error("Watcher not found");
    }

    if (!watcher.resourceId) {
      throw new Error("Watcher resourceId not found");
    }

    await calendar.channels.stop({
      requestBody: {
        id: watcher.id,
        resourceId: watcher.resourceId,
      },
    });
  });
}
