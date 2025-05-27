import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { z } from "zod";

import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import {
  externalGoogleCalendarEventsWatchersTable,
  externalGoogleCalendarListWatchersTable,
} from "@kokoro/db/schema";
import {
  CALENDARS_SYNC_QUEUE,
  CALENDAR_EVENTS_SYNC_QUEUE,
  publish,
} from "@kokoro/queues";
import { GOOGLE_CALENDAR } from "@kokoro/validators/db";

import { logger } from "../../logger";

/**
 * Schema for Google Calendar webhook headers
 * These headers are sent by Google Calendar when a watched resource changes
 *
 * @see https://developers.google.com/calendar/api/guides/push#headers
 */
const googleCalendarWebhookHeadersSchema = z.object({
  /**
   * UUID or other unique string you provided to identify this notification channel.
   * Always present.
   */
  "x-goog-channel-id": z.string().uuid(),

  /**
   * Integer that identifies this message for this notification channel.
   * Value is always 1 for sync messages. Message numbers increase for each
   * subsequent message on the channel, but they're not sequential.
   * Always present.
   */
  "x-goog-message-number": z
    .string()
    .transform((val) => Number.parseInt(val, 10)),

  /**
   * An opaque value identifying the watched resource.
   * This ID is stable across API versions.
   * Always present.
   */
  "x-goog-resource-id": z.string(),

  /**
   * The new resource state that triggered the notification.
   * Possible values: sync, exists, or not_exists
   * Always present.
   */
  "x-goog-resource-state": z.enum(["sync", "exists", "not_exists"]),

  /**
   * An API-version-specific identifier for the watched resource.
   * Always present.
   */
  "x-goog-resource-uri": z.string().url(),

  /**
   * Date and time of notification channel expiration, expressed in human-readable format.
   * Only present if defined.
   */
  "x-goog-channel-expiration": z.string(),

  /**
   * Notification channel token that was set by your application,
   * and that you can use to verify the notification source.
   * Only present if defined.
   */
  "x-goog-channel-token": z.string().optional(),
});

type GoogleCalendarWebhookHeaders = z.infer<
  typeof googleCalendarWebhookHeadersSchema
>;

function parseGoogleCalendarWebhookHeaders(
  headers: Headers
): GoogleCalendarWebhookHeaders {
  const rawHeaders: Record<string, string> = {};

  // Convert Headers object to plain object
  headers.forEach((value, key) => {
    rawHeaders[key.toLowerCase()] = value;
  });

  return googleCalendarWebhookHeadersSchema.parse(rawHeaders);
}

const watchGoogleCalendar = new Hono().use(
  "*",
  pinoLogger({
    pino: logger.child({
      subrouter: "watchGoogleCalendar",
    }),
  })
);

watchGoogleCalendar.post("/calendarlist", async (c) => {
  let headers: GoogleCalendarWebhookHeaders;

  try {
    headers = parseGoogleCalendarWebhookHeaders(c.req.raw.headers);
  } catch (error) {
    c.var.logger.error(error, "Request failed");
    return c.text("Bad Request", 400);
  }

  const [channel] = await db
    .select()
    .from(externalGoogleCalendarListWatchersTable)
    .where(
      eq(
        externalGoogleCalendarListWatchersTable.id,
        headers["x-goog-channel-id"]
      )
    );

  if (channel.secret !== headers["x-goog-channel-token"]) {
    // TODO: Maybe log this and remove channel?
    return c.text("Forbidden", 403);
  }

  await publish(CALENDARS_SYNC_QUEUE, {
    integrationAccountId: channel.integrationAccountId,
    source: GOOGLE_CALENDAR,
  });

  return c.text("OK", 200);
});

watchGoogleCalendar.post("/events", async (c) => {
  let headers: GoogleCalendarWebhookHeaders;

  try {
    headers = parseGoogleCalendarWebhookHeaders(c.req.raw.headers);
  } catch (error) {
    c.var.logger.error(error, "Request failed");
    return c.text("Bad Request", 400);
  }

  const [channel] = await db
    .select()
    .from(externalGoogleCalendarEventsWatchersTable)
    .where(
      eq(
        externalGoogleCalendarEventsWatchersTable.id,
        headers["x-goog-channel-id"]
      )
    );

  if (channel.secret !== headers["x-goog-channel-token"]) {
    // TODO: Maybe log this and remove channel?
    return c.text("Forbidden", 403);
  }

  await publish(CALENDAR_EVENTS_SYNC_QUEUE, {
    integrationAccountId: channel.integrationAccountId,
    calendarId: channel.calendarId,
    source: GOOGLE_CALENDAR,
  });

  return c.text("OK", 200);
});

export { watchGoogleCalendar };
