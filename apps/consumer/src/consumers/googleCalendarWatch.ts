import { withGoogleAccount } from "@kokoro/google";
import {
  stopWatchingCalendarEvents,
  stopWatchingCalendarList,
  watchCalendarEvents,
  watchCalendarList,
} from "@kokoro/google/calendar";
import type { Consumer } from "@kokoro/queues";
import { GOOGLE_CALENDAR_WATCH_QUEUE, consume, publish } from "@kokoro/queues";
import { GOOGLE_CALENDAR } from "@kokoro/validators/db";

import { logger } from "../logger";

export const googleCalendarWatch = (): Consumer =>
  consume(
    GOOGLE_CALENDAR_WATCH_QUEUE,
    async (message) =>
      withGoogleAccount(
        message.integrationAccountId,
        GOOGLE_CALENDAR,
        async (googleAccount) => {
          if (message.shouldUnwatch) {
            const calendarId = message.calendarId;

            if (calendarId) {
              await stopWatchingCalendarEvents(googleAccount, calendarId);
            } else {
              await stopWatchingCalendarList(googleAccount);
            }

            if (message.rewatch) {
              await publish(GOOGLE_CALENDAR_WATCH_QUEUE, {
                userId: message.userId,
                integrationAccountId: message.integrationAccountId,
                calendarId: message.calendarId,
              });
            }

            return;
          }

          if (message.calendarId) {
            await watchCalendarEvents(googleAccount, message.calendarId);

            return;
          }

          await watchCalendarList(googleAccount);
        },
      ),
    logger,
  );
