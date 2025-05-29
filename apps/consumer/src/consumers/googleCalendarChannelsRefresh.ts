import { lte } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import {
  externalGoogleCalendarEventsWatchersTable,
  externalGoogleCalendarListWatchersTable,
} from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import {
  GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE,
  GOOGLE_CALENDAR_WATCH_QUEUE,
  consume,
  publish,
} from "@kokoro/queues";

export const googleCalendarChannelsRefresh = (): Consumer =>
  consume(GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE, async () => {
    const publishExpiringCalendarListChannels = // Getting the channels of calendarList that are about to expire in <2 days
      db
        .select()
        .from(externalGoogleCalendarListWatchersTable)
        .where(
          lte(
            externalGoogleCalendarListWatchersTable.expiryDate,
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          )
        )
        .then((channels) =>
          Promise.all(
            channels.map((channel) =>
              publish(GOOGLE_CALENDAR_WATCH_QUEUE, {
                integrationAccountId: channel.integrationAccountId,
                userId: channel.userId,
                shouldUnwatch: true,
                rewatch: true,
              })
            )
          )
        );

    // Getting the channels of calendarEvents that are about to expire in <2 days
    const publishExpiringCalendarEventsChannels = db
      .select()
      .from(externalGoogleCalendarEventsWatchersTable)
      .where(
        lte(
          externalGoogleCalendarEventsWatchersTable.expiryDate,
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        )
      )
      .execute()
      .then((channels) =>
        Promise.all(
          channels.map((channel) =>
            publish(GOOGLE_CALENDAR_WATCH_QUEUE, {
              integrationAccountId: channel.integrationAccountId,
              userId: channel.userId,
              shouldUnwatch: true,
              rewatch: true,
            })
          )
        )
      );

    await Promise.all([
      publishExpiringCalendarListChannels,
      publishExpiringCalendarEventsChannels,
    ]);
  });
