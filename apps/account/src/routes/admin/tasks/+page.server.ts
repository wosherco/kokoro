import { fail } from "@sveltejs/kit";

import {
  GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE,
  GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE,
  publish,
} from "@kokoro/queues";

import type { Actions } from "./$types";

export const actions = {
  refreshCalendars: async () => {
    try {
      await publish(GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE, {});

      return {
        success: true,
      };
    } catch {
      return fail(500);
    }
  },

  refreshWatchers: async () => {
    try {
      await publish(GOOGLE_CALENDAR_CHANNELS_REFRESH_QUEUE, {});

      return {
        success: true,
        message: "Calendar watchers refresh triggered successfully",
      };
    } catch {
      return fail(500, {
        success: false,
        message: "Failed to refresh calendar watchers",
      });
    }
  },
} satisfies Actions;
