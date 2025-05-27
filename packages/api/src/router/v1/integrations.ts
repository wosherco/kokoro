import { addMinutes } from "date-fns";

import { filterNil, groupBy } from "@kokoro/common/poldash";
import { and, eq, isNull, not, or } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import {
  calendarTable,
  integrationsAccountsTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import {
  CALENDARS_SYNC_QUEUE,
  CALENDAR_EVENTS_SYNC_QUEUE,
  TASKLIST_SYNC_QUEUE,
  TASK_SYNC_QUEUE,
  publish,
} from "@kokoro/queues";
import type {
  CalendarSource,
  IntegrationType,
  TaskSource,
} from "@kokoro/validators/db";
import {
  CALENDAR_SOURCES,
  INTEGRATION_TYPES,
  RELAXED_MAPPED_INTEGRATION_SOURCES,
  TASK_SOURCES,
} from "@kokoro/validators/db";

import { getCalendarSource } from "@kokoro/brain/calendar";
import { env } from "../../../env";
import {
  authorizedMiddleware,
  integrationAccountMiddleware,
  os,
  protectedCalendarIntegrationProcedure,
  protectedTasklistIntegrationProcedure,
} from "../../orpc";
import { v1IntegrationsLinearRouter } from "./integrations/linear";
import { ORPCError } from "@orpc/server";

const SYNC_COOLDOWN_MINUTES = 30;

export const v1IntegrationsRouter = os.v1.integrations.router({
  listIntegrations: os.v1.integrations.listIntegrations
    .use(authorizedMiddleware)
    .handler(async ({ context }) => {
      const dbIntegrations = await db
        .select({
          id: integrationsAccountsTable.id,
          integrationType: integrationsAccountsTable.integrationType,
          displayName: integrationsAccountsTable.platformDisplayName,
          tasklist: {
            id: tasklistsTable.id,
            name: tasklistsTable.name,
            colorOverride: tasklistsTable.colorOverride,
            color: tasklistsTable.color,
            hidden: tasklistsTable.hidden,
          },
          calendar: {
            id: calendarTable.id,
            summary: calendarTable.summary,
            summaryOverride: calendarTable.summaryOverride,
            description: calendarTable.description,
            color: calendarTable.color,
            colorOverride: calendarTable.colorOverride,
            hidden: calendarTable.hidden,
          },
        })
        .from(integrationsAccountsTable)
        .leftJoin(
          calendarTable,
          eq(integrationsAccountsTable.id, calendarTable.integrationAccountId)
        )
        .leftJoin(
          tasklistsTable,
          eq(integrationsAccountsTable.id, tasklistsTable.integrationAccountId)
        )
        .where(
          and(
            eq(integrationsAccountsTable.userId, context.user.id),
            or(not(calendarTable.hidden), isNull(calendarTable.hidden)),
            or(not(tasklistsTable.hidden), isNull(tasklistsTable.hidden))
          )
        );

      const groupedAccounts = groupBy(dbIntegrations, "id");
      type GroupedAccount = Omit<
        (typeof dbIntegrations)[number],
        "calendar" | "tasklist"
      > & {
        calendars: NonNullable<(typeof dbIntegrations)[number]["calendar"]>[];
        tasklists: NonNullable<(typeof dbIntegrations)[number]["tasklist"]>[];
        supports: IntegrationType[];
      };

      const integrations = Object.values(groupedAccounts).reduce(
        (acc, accounts) => {
          const first = accounts[0];

          if (!first) {
            return acc;
          }

          // biome-ignore lint/performance/noDelete: performance bottleneck to be worried in the future
          delete (first as unknown as { calendar: unknown }).calendar;
          // biome-ignore lint/performance/noDelete: performance bottleneck to be worried in the future
          delete (first as unknown as { tasklist: unknown }).tasklist;

          acc.push({
            ...(first as Omit<
              (typeof dbIntegrations)[number],
              "calendar" | "tasklist"
            >),
            calendars: filterNil(accounts.map((account) => account.calendar)),
            tasklists: filterNil(accounts.map((account) => account.tasklist)),
            supports: INTEGRATION_TYPES.filter((type) =>
              RELAXED_MAPPED_INTEGRATION_SOURCES[type].includes(
                first.integrationType
              )
            ),
          });

          return acc;
        },
        [] as GroupedAccount[]
      );

      return integrations;
    }),

  queueAccountSync: os.v1.integrations.queueAccountSync
    .use(integrationAccountMiddleware)
    .handler(async ({ context }) => {
      const { integrationAccount } = context;

      // TODO: Limit syncing with rate limiting

      if (
        TASK_SOURCES.includes(integrationAccount.integrationType as TaskSource)
      ) {
        await publish(TASKLIST_SYNC_QUEUE, {
          integrationAccountId: integrationAccount.id,
        });
      }

      if (
        CALENDAR_SOURCES.includes(
          integrationAccount.integrationType as CalendarSource
        )
      ) {
        await publish(CALENDARS_SYNC_QUEUE, {
          integrationAccountId: integrationAccount.id,
          source: integrationAccount.integrationType as CalendarSource,
        });
      }

      return { success: true };
    }),

  toggleCalendarVisibility: os.v1.integrations.toggleCalendarVisibility
    .use(protectedCalendarIntegrationProcedure)
    .handler(async ({ context, input }) => {
      const { calendar } = context;
      const { hidden } = input;

      await db
        .update(calendarTable)
        .set({ hidden })
        .where(eq(calendarTable.id, calendar.id));

      return { success: true };
    }),

  changeCalendarColor: os.v1.integrations.changeCalendarColor
    .use(protectedCalendarIntegrationProcedure)
    .handler(async ({ context, input }) => {
      const { calendar } = context;
      const { color } = input;

      await db
        .update(calendarTable)
        .set({ colorOverride: color })
        .where(eq(calendarTable.id, calendar.id));

      return { success: true };
    }),

  queueCalendarSync: os.v1.integrations.queueCalendarSync
    .use(protectedCalendarIntegrationProcedure)
    .handler(async ({ context }) => {
      const { calendar } = context;

      if (
        env.PUBLIC_ENVIRONMENT !== "development" &&
        calendar.lastSynced &&
        new Date() < addMinutes(calendar.lastSynced, SYNC_COOLDOWN_MINUTES)
      ) {
        throw new ORPCError("TOO_MANY_REQUESTS");
      }

      await publish(CALENDAR_EVENTS_SYNC_QUEUE, {
        integrationAccountId: context.integrationAccount.id,
        source: context.integrationAccount.integrationType as CalendarSource,
        calendarId: calendar.id,
      });

      return { success: true };
    }),

  toggleTasklistVisibility: os.v1.integrations.toggleTasklistVisibility
    .use(protectedTasklistIntegrationProcedure)
    .handler(async ({ context, input }) => {
      const { tasklist } = context;
      const { hidden } = input;

      await db
        .update(tasklistsTable)
        .set({ hidden })
        .where(eq(tasklistsTable.id, tasklist.id));

      return { success: true };
    }),

  changeTasklistColor: os.v1.integrations.changeTasklistColor
    .use(protectedTasklistIntegrationProcedure)
    .handler(async ({ context, input }) => {
      const { tasklist } = context;
      const { color } = input;

      await db
        .update(tasklistsTable)
        .set({ colorOverride: color })
        .where(eq(tasklistsTable.id, tasklist.id));

      return { success: true };
    }),

  queueTasklistSync: os.v1.integrations.queueTasklistSync
    .use(protectedTasklistIntegrationProcedure)
    .handler(async ({ context }) => {
      const { tasklist } = context;

      if (
        env.PUBLIC_ENVIRONMENT !== "development" &&
        tasklist.lastSynced &&
        new Date() < addMinutes(tasklist.lastSynced, SYNC_COOLDOWN_MINUTES)
      ) {
        throw new ORPCError("TOO_MANY_REQUESTS");
      }

      await publish(TASK_SYNC_QUEUE, {
        integrationAccountId: context.integrationAccount.id,
        source: context.integrationAccount.integrationType as TaskSource,
        tasklistId: tasklist.id,
      });

      return { success: true };
    }),

  deleteAccount: os.v1.integrations.deleteAccount
    .use(integrationAccountMiddleware)
    .handler(async ({ context }) => {
      const { integrationAccount } = context;

      if (
        CALENDAR_SOURCES.includes(
          integrationAccount.integrationType as CalendarSource
        )
      ) {
        const calendarSource = getCalendarSource(
          integrationAccount.integrationType as CalendarSource
        );

        await calendarSource.deleteIntegrationAccount(integrationAccount.id);
      }

      await db
        .delete(integrationsAccountsTable)
        .where(
          and(
            eq(integrationsAccountsTable.id, integrationAccount.id),
            eq(integrationsAccountsTable.userId, context.user.id)
          )
        );

      return { success: true };
    }),

  linear: v1IntegrationsLinearRouter,
});
