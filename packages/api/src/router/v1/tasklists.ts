import { and, eq, not } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { tasklistsTable } from "@kokoro/db/schema";

import { ORPCError } from "@orpc/server";
import { os, authorizedMiddleware } from "../../orpc";

export const v1TasklistsRouter = os.v1.tasklists.router({
  getTasklist: os.v1.tasklists.getTasklist
    .use(authorizedMiddleware)
    .handler(async ({ context, input }) => {
      const [tasklist] = await db
        .select({
          id: tasklistsTable.id,
          integrationAccountId: tasklistsTable.integrationAccountId,
          platformAccountId: tasklistsTable.platformAccountId,
          platformTaskListId: tasklistsTable.platformTaskListId,
          source: tasklistsTable.source,

          name: tasklistsTable.name,
          config: tasklistsTable.config,

          color: tasklistsTable.color,
          colorOverride: tasklistsTable.colorOverride,

          createdAt: tasklistsTable.createdAt,
          updatedAt: tasklistsTable.updatedAt,
          lastSynced: tasklistsTable.lastSynced,
        })
        .from(tasklistsTable)
        .where(
          and(
            eq(tasklistsTable.id, input.tasklistId),
            eq(tasklistsTable.userId, context.user.id),
            not(tasklistsTable.hidden),
          ),
        );

      if (!tasklist) {
        throw new ORPCError("NOT_FOUND");
      }

      return {
        tasklist: {
          ...tasklist,
          lastSynced: tasklist.lastSynced?.toISOString() ?? null,
        },
        prompt: "TODO",
      };
    }),
});
