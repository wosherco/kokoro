import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { addMinutes } from "date-fns";
import { z } from "zod";

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
  protectedCalendarIntegrationProcedure,
  protectedIntegrationProcedure,
  protectedProcedure,
  protectedTasklistIntegrationProcedure,
} from "../../trpc";
import { v1IntegrationsLinearRouter } from "./integrations/linear";

const SYNC_COOLDOWN_MINUTES = 30;

export const v1IntegrationsRouter = {
  listIntegrations: protectedProcedure.query(async ({ ctx }) => {
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
        },
      })
      .from(integrationsAccountsTable)
      .leftJoin(
        calendarTable,
        eq(integrationsAccountsTable.id, calendarTable.integrationAccountId),
      )
      .leftJoin(
        tasklistsTable,
        eq(integrationsAccountsTable.id, tasklistsTable.integrationAccountId),
      )
      .where(
        and(
          eq(integrationsAccountsTable.userId, ctx.user.id),
          or(not(calendarTable.hidden), isNull(calendarTable.hidden)),
          or(not(tasklistsTable.hidden), isNull(tasklistsTable.hidden)),
        ),
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
              first.integrationType,
            ),
          ),
        });

        return acc;
      },
      [] as GroupedAccount[],
    );

    return integrations;
  }),

  queueAccountSync: protectedIntegrationProcedure.mutation(async ({ ctx }) => {
    const { integrationAccount } = ctx;

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
        integrationAccount.integrationType as CalendarSource,
      )
    ) {
      await publish(CALENDARS_SYNC_QUEUE, {
        integrationAccountId: integrationAccount.id,
        source: integrationAccount.integrationType as CalendarSource,
      });
    }

    return { success: true };
  }),

  toggleCalendarVisibility: protectedCalendarIntegrationProcedure
    .input(
      z.object({
        hidden: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { calendar } = ctx;
      const { hidden } = input;

      await db
        .update(calendarTable)
        .set({ hidden })
        .where(eq(calendarTable.id, calendar.id));

      return { success: true };
    }),

  changeCalendarColor: protectedCalendarIntegrationProcedure
    .input(
      z.object({
        color: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { calendar } = ctx;
      const { color } = input;

      await db
        .update(calendarTable)
        .set({ colorOverride: color })
        .where(eq(calendarTable.id, calendar.id));

      return { success: true };
    }),

  queueCalendarSync: protectedCalendarIntegrationProcedure.mutation(
    async ({ ctx }) => {
      const { calendar } = ctx;

      if (
        env.PUBLIC_ENVIRONMENT !== "development" &&
        calendar.lastSynced &&
        new Date() < addMinutes(calendar.lastSynced, SYNC_COOLDOWN_MINUTES)
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Please wait ${SYNC_COOLDOWN_MINUTES} minutes between syncs`,
        });
      }

      await publish(CALENDAR_EVENTS_SYNC_QUEUE, {
        integrationAccountId: ctx.integrationAccount.id,
        source: ctx.integrationAccount.integrationType as CalendarSource,
        calendarId: calendar.id,
      });

      return { success: true };
    },
  ),

  toggleTasklistVisibility: protectedTasklistIntegrationProcedure
    .input(
      z.object({
        hidden: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tasklist } = ctx;
      const { hidden } = input;

      await db
        .update(tasklistsTable)
        .set({ hidden })
        .where(eq(tasklistsTable.id, tasklist.id));

      return { success: true };
    }),

  changeTasklistColor: protectedTasklistIntegrationProcedure
    .input(
      z.object({
        color: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tasklist } = ctx;
      const { color } = input;

      await db
        .update(tasklistsTable)
        .set({ colorOverride: color })
        .where(eq(tasklistsTable.id, tasklist.id));

      return { success: true };
    }),

  queueTaskSync: protectedTasklistIntegrationProcedure.mutation(
    async ({ ctx }) => {
      const { tasklist } = ctx;

      if (
        env.PUBLIC_ENVIRONMENT !== "development" &&
        tasklist.lastSynced &&
        new Date() < addMinutes(tasklist.lastSynced, SYNC_COOLDOWN_MINUTES)
      ) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Please wait ${SYNC_COOLDOWN_MINUTES} minutes between syncs`,
        });
      }

      await publish(TASK_SYNC_QUEUE, {
        integrationAccountId: ctx.integrationAccount.id,
        source: ctx.integrationAccount.integrationType as TaskSource,
        tasklistId: tasklist.id,
      });

      return { success: true };
    },
  ),

  deleteAccount: protectedIntegrationProcedure.mutation(async ({ ctx }) => {
    const { integrationAccount } = ctx;

    if (
      CALENDAR_SOURCES.includes(
        integrationAccount.integrationType as CalendarSource,
      )
    ) {
      const calendarSource = getCalendarSource(
        integrationAccount.integrationType as CalendarSource,
      );

      await calendarSource.deleteIntegrationAccount(integrationAccount.id);
    }

    await db
      .delete(integrationsAccountsTable)
      .where(
        and(
          eq(integrationsAccountsTable.id, integrationAccount.id),
          eq(integrationsAccountsTable.userId, ctx.user.id),
        ),
      );

    return { success: true };
  }),

  linear: v1IntegrationsLinearRouter,
} satisfies TRPCRouterRecord;
