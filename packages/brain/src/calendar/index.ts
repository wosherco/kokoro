import type { CalendarSource } from "@kokoro/validators/db";
import { GOOGLE_CALENDAR } from "@kokoro/validators/db";

import { GoogleCalendarEventSource } from "./google";

export { ReadWriteEventsSource, ReadOnlyEventsSource } from "./base";

const CALENDAR_SOURCES = {
  [GOOGLE_CALENDAR]: new GoogleCalendarEventSource(),
} as const;

export function getCalendarSource<T extends CalendarSource>(
  source: T,
): (typeof CALENDAR_SOURCES)[T] {
  return CALENDAR_SOURCES[source];
}
