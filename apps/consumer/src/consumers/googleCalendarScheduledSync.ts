import { and, eq, gt, gte, inArray, isNotNull, sql } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import {
  calendarTable,
  integrationsAccountsTable,
  userTable,
} from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import {
  CALENDARS_SYNC_QUEUE,
  CALENDAR_EVENTS_SYNC_QUEUE,
  GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE,
  consume,
  publish,
} from "@kokoro/queues";
import { GOOGLE_CALENDAR } from "@kokoro/validators/db";

import { env } from "../env";

const lastTimeInterval = 3 * 3600 * 1000;

export const googleCalendarScheduledSync = (): Consumer =>
  consume(GOOGLE_CALENDAR_SCHEDULED_SYNC_QUEUE, async (message) => {
    console.info("[googleCalendarScheduledSync] Starting all sync", message);

    const [calendarAccounts, eventsAccounts] = await Promise.all([
      // For accounts, to sync calendars
      db
        .select({
          integrationAccountId: integrationsAccountsTable.id,
        })
        .from(integrationsAccountsTable)
        .innerJoin(
          calendarTable,
          eq(calendarTable.integrationAccountId, integrationsAccountsTable.id),
        )
        .innerJoin(
          userTable,
          eq(userTable.id, integrationsAccountsTable.userId),
        )
        .where(
          and(
            message.users
              ? inArray(integrationsAccountsTable.userId, message.users)
              : sql`true`,
            message.bypassTimeLimit === false
              ? gte(
                  calendarTable.lastSynced,
                  new Date(Date.now() - lastTimeInterval),
                )
              : sql`true`,
            env.PUBLIC_STRIPE_ENABLED
              ? and(
                  isNotNull(userTable.subscribedUntil),
                  gt(userTable.subscribedUntil, new Date()),
                )
              : undefined,
          ),
        )
        .execute(),
      // For calendars, to sync events
      db
        .select({
          integrationAccountId: calendarTable.integrationAccountId,
          calendarId: calendarTable.id,
          platformCalendarId: calendarTable.platformCalendarId,
        })
        .from(calendarTable)
        .innerJoin(userTable, eq(userTable.id, calendarTable.userId))
        .where(
          and(
            message.users
              ? inArray(calendarTable.userId, message.users)
              : sql`true`,
            message.bypassTimeLimit === false
              ? gte(
                  calendarTable.lastSynced,
                  new Date(Date.now() - lastTimeInterval),
                )
              : sql`true`,
            env.PUBLIC_STRIPE_ENABLED
              ? and(
                  isNotNull(userTable.subscribedUntil),
                  gt(userTable.subscribedUntil, new Date()),
                )
              : undefined,
          ),
        )
        .execute(),
    ]);

    console.info(
      "[googleCalendarScheduledSync] Publishing calendars list syncs",
      calendarAccounts.length,
    );

    await Promise.all(
      calendarAccounts.map((account) =>
        publish(CALENDARS_SYNC_QUEUE, {
          integrationAccountId: account.integrationAccountId,
          source: GOOGLE_CALENDAR,
        }),
      ),
    );

    console.info(
      "[googleCalendarScheduledSync] Publishing events syncs",
      eventsAccounts.length,
    );

    await Promise.all(
      eventsAccounts.map((account) =>
        publish(CALENDAR_EVENTS_SYNC_QUEUE, {
          integrationAccountId: account.integrationAccountId,
          source: GOOGLE_CALENDAR,
          calendarId: account.calendarId,
        }),
      ),
    );
  });
