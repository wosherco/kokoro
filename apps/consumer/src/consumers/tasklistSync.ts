import { getTaskSource } from "@kokoro/brain/tasks";
import { db } from "@kokoro/db/client";
import { withLinear } from "@kokoro/linear";
import { fetchLinearTasklist } from "@kokoro/linear/tasks";
import type { Consumer } from "@kokoro/queues";
import { TASKLIST_SYNC_QUEUE, consume } from "@kokoro/queues";
import { LINEAR } from "@kokoro/validators/db";

export const tasklistSync = (): Consumer =>
  consume(TASKLIST_SYNC_QUEUE, async (message) => {
    const linearSource = getTaskSource(LINEAR);

    if (!message.tasklistId) {
      await linearSource.syncTasklists(message.integrationAccountId);

      return;
    }

    const { tasklistId } = message;

    let userId: string | undefined;
    let platformAccountId: string | undefined;

    const tasklist = await withLinear(
      message.integrationAccountId,
      (account) => {
        userId = account.userId;
        platformAccountId = account.platformAccountId;
        return fetchLinearTasklist(account, tasklistId);
      }
    );

    if (userId && platformAccountId) {
      await linearSource.processTasklist(
        {
          integrationAccountId: message.integrationAccountId,
          platformAccountId,
          userId,
        },
        tasklist,
        db
      );
    }
  });
