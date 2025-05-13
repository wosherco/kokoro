import { getTaskSource } from "@kokoro/brain/tasks";
import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { tasklistsTable } from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import { TASK_SYNC_QUEUE, consume } from "@kokoro/queues";

import { logger } from "../logger";

export const taskSync = (): Consumer =>
  consume(
    TASK_SYNC_QUEUE,
    async (message) => {
      const taskSource = getTaskSource(message.source);

      const { platformTaskId } = message;

      if (!platformTaskId) {
        // Since no specific task was requested, we'll sync all tasks
        await taskSource.syncTasks(
          message.integrationAccountId,
          message.tasklistId,
        );

        return;
      }

      const tasklists = await db
        .select()
        .from(tasklistsTable)
        .where(
          and(
            eq(tasklistsTable.id, message.tasklistId),
            eq(
              tasklistsTable.integrationAccountId,
              message.integrationAccountId,
            ),
          ),
        );

      if (tasklists.length === 0) {
        throw new Error("Tasklist not found");
      }

      const tasklist = tasklists[0];

      const task = await taskSource.fetchPlatformTask(
        message.integrationAccountId,
        platformTaskId,
      );

      await taskSource.processItem(
        {
          integrationAccountId: message.integrationAccountId,
          userId: tasklist.userId,
          platformAccountId: tasklist.platformAccountId,
          platformTasklistId: tasklist.platformTaskListId,
          tasklistId: tasklist.id,
        },
        task,
        db,
      );
    },
    logger,
  );
