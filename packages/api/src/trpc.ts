/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";

import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import type { Session, User } from "@kokoro/db/schema";
import {
  calendarTable,
  integrationsAccountsTable,
  oauthClientTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import type { CalendarSource, TaskSource } from "@kokoro/validators/db";
import { CALENDAR_SOURCES, TASK_SOURCES } from "@kokoro/validators/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = (opts: {
  headers: Headers;
  user: User | null;
  session: Session | null;
}) => {
  const source = opts.headers.get("x-trpc-source") ?? "unknown";

  console.log(">>> tRPC Request from", source, "by", opts.user?.id);

  return {
    user: opts.user,
    session: opts.session,
    headers: opts.headers,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      // Reassigning to make it non-null
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const protectedApiAccessProcedure = protectedProcedure.use(
  ({ ctx, next }) => {
    if (!ctx.user.accessToApi) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next();
  },
);

export const protectedOauthApplicationProcedure = protectedApiAccessProcedure
  .input(
    z.object({
      applicationId: z.string().uuid(),
    }),
  )
  .use(async ({ ctx, input, next }) => {
    const [oauthApplication] = await db
      .select()
      .from(oauthClientTable)
      .where(
        and(
          eq(oauthClientTable.id, input.applicationId),
          eq(oauthClientTable.ownerId, ctx.user.id),
        ),
      );

    if (!oauthApplication) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return next({
      ctx: {
        oauthApplication,
      },
    });
  });

/**
 * Protected (authenticated) integration procedure
 *
 * This integrations already fetches an integration account, verifies it pertains to the user, and
 * so we don't need to fetch it again.
 */
export const protectedIntegrationProcedure = protectedProcedure
  .input(
    z.object({
      integrationAccountId: z.string().uuid(),
    }),
  )
  .use(async ({ ctx, input, next }) => {
    const [integrationAccount] = await db
      .select()
      .from(integrationsAccountsTable)
      .where(
        and(
          eq(integrationsAccountsTable.id, input.integrationAccountId),
          eq(integrationsAccountsTable.userId, ctx.user.id),
        ),
      );

    if (!integrationAccount) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Integration account not found",
      });
    }

    return next({
      ctx: {
        integrationAccount,
      },
    });
  });

/**
 * Protected (authenticated) calendar integration procedure
 *
 * This integrations already fetches a calendar, verifies it pertains to the user, and
 * so we don't need to fetch it again.
 */
export const protectedCalendarIntegrationProcedure =
  protectedIntegrationProcedure
    .input(
      z.object({
        calendarId: z.string().uuid(),
      }),
    )
    .use(async ({ ctx, input, next }) => {
      if (
        !CALENDAR_SOURCES.includes(
          ctx.integrationAccount.integrationType as CalendarSource,
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Integration account does not support calendars",
        });
      }

      const [calendar] = await db
        .select()
        .from(calendarTable)
        .where(
          and(
            eq(calendarTable.id, input.calendarId),
            eq(calendarTable.userId, ctx.user.id),
            eq(
              calendarTable.platformAccountId,
              ctx.integrationAccount.platformAccountId,
            ),
            eq(
              calendarTable.source,
              ctx.integrationAccount.integrationType as CalendarSource,
            ),
          ),
        );

      if (!calendar) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Calendar not found",
        });
      }

      return next({
        ctx: {
          calendar,
        },
      });
    });

/**
 * Protected (authenticated) tasklist integration procedure
 *
 * This integrations already fetches a tasklist, verifies it pertains to the user, and
 * so we don't need to fetch it again.
 */
export const protectedTasklistIntegrationProcedure =
  protectedIntegrationProcedure
    .input(
      z.object({
        tasklistId: z.string().uuid(),
      }),
    )
    .use(async ({ ctx, input, next }) => {
      if (
        !TASK_SOURCES.includes(
          ctx.integrationAccount.integrationType as TaskSource,
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Integration account does not support tasklists",
        });
      }

      const [tasklist] = await db
        .select()
        .from(tasklistsTable)
        .where(
          and(
            eq(tasklistsTable.id, input.tasklistId),
            eq(tasklistsTable.userId, ctx.user.id),
            eq(
              tasklistsTable.platformAccountId,
              ctx.integrationAccount.platformAccountId,
            ),
            eq(
              tasklistsTable.source,
              ctx.integrationAccount.integrationType as TaskSource,
            ),
          ),
        );

      if (!tasklist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tasklist not found",
        });
      }

      return next({
        ctx: {
          tasklist,
        },
      });
    });

/**
 * Admin Protected procedure
 *
 * @see https://trpc.io/docs/procedures
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // if (ctx.user.role !== "ADMIN") {
  //   throw new TRPCError({
  //     code: "FORBIDDEN",
  //   });
  // }

  return next();
});
