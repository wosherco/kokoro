import { validateSessionRequest } from "@kokoro/auth";
import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import type { Session, User } from "@kokoro/db/schema";
import {
  calendarTable,
  integrationsAccountsTable,
  oauthClientTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import { orpcContract } from "@kokoro/validators/contracts";
import type { CalendarSource, TaskSource } from "@kokoro/validators/db";
import { CALENDAR_SOURCES, TASK_SOURCES } from "@kokoro/validators/db";
import { ORPCError, implement } from "@orpc/server";

export const os =
  implement(orpcContract).$context<Awaited<ReturnType<typeof createContext>>>();

export const createContext = async (headers: Headers) => {
  const { user, session } = await validateSessionRequest(headers);

  const source = headers.get("x-orpc-source") ?? "unknown";

  console.log(">>> oRPC Request from", source, "by", user?.id);

  return {
    user,
    session,
    headers,
  };
};

export const authorizedMiddleware = os.middleware(({ context, next }) => {
  if (!context.user || !context.session) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      user: context.user,
      session: context.session,
    },
  });
});

export const protectedApiAccessMiddleware = authorizedMiddleware.concat(
  ({ context, next }) => {
    if (!context.user.accessToApi) {
      throw new ORPCError("FORBIDDEN");
    }
    return next();
  },
);

export const protectedOauthApplicationMiddleware = authorizedMiddleware.concat(
  async ({ context, next }, input: { applicationId: string }) => {
    const [oauthApplication] = await db
      .select()
      .from(oauthClientTable)
      .where(
        and(
          eq(oauthClientTable.id, input.applicationId),
          eq(oauthClientTable.ownerId, context.user.id),
        ),
      );

    if (!oauthApplication) {
      throw new ORPCError("NOT_FOUND");
    }

    return next({
      context: {
        oauthApplication,
      },
    });
  },
);

/**
 * Protected (authenticated) integration procedure
 *
 * This integrations already fetches an integration account, verifies it pertains to the user, and
 * so we don't need to fetch it again.
 */
export const integrationAccountMiddleware = authorizedMiddleware.concat(
  async ({ context, next }, input: { integrationAccountId: string }) => {
    const [integrationAccount] = await db
      .select()
      .from(integrationsAccountsTable)
      .where(
        and(
          eq(integrationsAccountsTable.id, input.integrationAccountId),
          eq(integrationsAccountsTable.userId, context.user.id),
        ),
      );

    if (!integrationAccount) {
      throw new ORPCError("NOT_FOUND");
    }

    return next({
      context: {
        integrationAccount,
      },
    });
  },
);

/**
 * Protected (authenticated) calendar integration procedure
 *
 * This integrations already fetches a calendar, verifies it pertains to the user, and
 * so we don't need to fetch it again.
 */
export const protectedCalendarIntegrationProcedure =
  integrationAccountMiddleware.concat(
    async (
      { context, next },
      input: { integrationAccountId: string; calendarId: string },
    ) => {
      if (
        !CALENDAR_SOURCES.includes(
          context.integrationAccount.integrationType as CalendarSource,
        )
      ) {
        throw new ORPCError("BAD_REQUEST");
      }

      const [calendar] = await db
        .select()
        .from(calendarTable)
        .where(
          and(
            eq(calendarTable.id, input.calendarId),
            eq(calendarTable.userId, context.user.id),
            eq(
              calendarTable.platformAccountId,
              context.integrationAccount.platformAccountId,
            ),
            eq(
              calendarTable.source,
              context.integrationAccount.integrationType as CalendarSource,
            ),
          ),
        );

      if (!calendar) {
        throw new ORPCError("NOT_FOUND");
      }

      return next({
        context: {
          calendar,
        },
      });
    },
  );

/**
 * Protected (authenticated) tasklist integration procedure
 *
 * This integrations already fetches a tasklist, verifies it pertains to the user, and
 * so we don't need to fetch it again.
 */
export const protectedTasklistIntegrationProcedure =
  integrationAccountMiddleware.concat(
    async (
      { context, next },
      input: { integrationAccountId: string; tasklistId: string },
    ) => {
      if (
        !TASK_SOURCES.includes(
          context.integrationAccount.integrationType as TaskSource,
        )
      ) {
        throw new ORPCError("BAD_REQUEST");
      }

      const [tasklist] = await db
        .select()
        .from(tasklistsTable)
        .where(
          and(
            eq(tasklistsTable.id, input.tasklistId),
            eq(tasklistsTable.userId, context.user.id),
            eq(
              tasklistsTable.platformAccountId,
              context.integrationAccount.platformAccountId,
            ),
            eq(
              tasklistsTable.source,
              context.integrationAccount.integrationType as TaskSource,
            ),
          ),
        );

      if (!tasklist) {
        throw new ORPCError("NOT_FOUND");
      }

      return next({
        context: {
          tasklist,
        },
      });
    },
  );
