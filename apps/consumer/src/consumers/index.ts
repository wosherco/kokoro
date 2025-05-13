import type { Consumer } from "@kokoro/queues";

import { calendarEventsSync } from "./calendarEventsSync";
import { calendarsSync } from "./calendarsSync";
import { contactsSync } from "./contactsSync";
import { fulfillEmbedding } from "./fulfillEmbeddings";
import { googleCalendarChannelsRefresh } from "./googleCalendarChannelsRefresh";
import { googleCalendarScheduledSync } from "./googleCalendarScheduledSync";
import { googleCalendarWatch } from "./googleCalendarWatch";
import { googleContactsScheduledSync } from "./googleContactsScheduledSync";
import { taskSync } from "./taskSync";
import { tasklistSync } from "./tasklistSync";

export const CONSUMERS: (() => Consumer)[] = [
  googleCalendarWatch,
  googleCalendarChannelsRefresh,
  googleCalendarScheduledSync,
  googleContactsScheduledSync,
  fulfillEmbedding,
  tasklistSync,
  taskSync,
  contactsSync,
  calendarsSync,
  calendarEventsSync,
] as const;
