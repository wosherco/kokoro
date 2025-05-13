/* eslint-disable @typescript-eslint/only-throw-error */
import { error } from "@sveltejs/kit";

import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import {
  calendarTable,
  integrationsAccountsTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import type {
  CalendarSource,
  ContactSource,
  TaskSource,
} from "@kokoro/validators/db";
import {
  CALENDAR_SOURCES,
  CONTACT_SOURCES,
  TASK_SOURCES,
} from "@kokoro/validators/db";

import { TUNNELED_SERVER_URL } from "@kokoro/consts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const userId = locals.auth.user.id;

  const [integrationAccount] = await db
    .select({
      id: integrationsAccountsTable.id,
      integrationType: integrationsAccountsTable.integrationType,
      platformAccountId: integrationsAccountsTable.platformAccountId,
      email: integrationsAccountsTable.email,
      profilePicture: integrationsAccountsTable.profilePicture,
      platformDisplayName: integrationsAccountsTable.platformDisplayName,
      platformData: integrationsAccountsTable.platformData,
      invalidGrant: integrationsAccountsTable.invalidGrant,
    })
    .from(integrationsAccountsTable)
    .where(
      and(
        eq(integrationsAccountsTable.userId, userId),
        eq(integrationsAccountsTable.id, params.integrationAccountId),
      ),
    );

  if (!integrationAccount) {
    throw error(404, "Integration account not found");
  }

  const tasklists = TASK_SOURCES.includes(
    integrationAccount.integrationType as TaskSource,
  )
    ? db
        .select({
          id: tasklistsTable.id,
          name: tasklistsTable.name,
          color: tasklistsTable.color,
          colorOverride: tasklistsTable.colorOverride,
          hidden: tasklistsTable.hidden,
          lastSynced: tasklistsTable.lastSynced,
        })
        .from(tasklistsTable)
        .where(
          and(
            eq(
              tasklistsTable.platformAccountId,
              integrationAccount.platformAccountId,
            ),
            eq(tasklistsTable.userId, userId),
            eq(
              tasklistsTable.source,
              integrationAccount.integrationType as TaskSource,
            ),
          ),
        )
    : undefined;

  const calendars = CALENDAR_SOURCES.includes(
    integrationAccount.integrationType as CalendarSource,
  )
    ? db
        .select({
          id: calendarTable.id,
          summary: calendarTable.summary,
          summaryOverride: calendarTable.summaryOverride,
          description: calendarTable.description,
          color: calendarTable.color,
          colorOverride: calendarTable.colorOverride,
          hidden: calendarTable.hidden,
          lastSynced: calendarTable.lastSynced,
        })
        .from(calendarTable)
        .where(
          and(
            eq(
              calendarTable.platformAccountId,
              integrationAccount.platformAccountId,
            ),
            eq(calendarTable.userId, userId),
            eq(
              calendarTable.source,
              integrationAccount.integrationType as CalendarSource,
            ),
          ),
        )
        .execute()
    : undefined;

  return {
    webhookBaseUrl: TUNNELED_SERVER_URL,
    integrationAccount,
    tasklists,
    calendars,
    contacts: CONTACT_SOURCES.includes(
      integrationAccount.integrationType as ContactSource,
    )
      ? "TODO"
      : undefined,
  };
};
