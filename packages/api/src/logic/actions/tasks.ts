import { getMemories } from "@kokoro/brain";
import { ReadWriteTaskSource, getTaskSource } from "@kokoro/brain/tasks";
import { and, eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { integrationsAccountsTable, tasklistsTable } from "@kokoro/db/schema";
import type {
  ActionPayload,
  TASKS_CREATE_TASK_ACTION,
  TASKS_DELETE_TASK_ACTION,
  TASKS_MODIFY_TASK_ACTION,
} from "@kokoro/validators/actions";
import type { TaskSource } from "@kokoro/validators/db";
import { TASK_SOURCES } from "@kokoro/validators/db";

import { parseDate } from "../../utils/date";
import type { ActionContext } from "./context";

async function getValidatedTaskContext(
  userId: string,
  integrationAccountId: string,
) {
  const [integrationAccount] = await db
    .select({
      id: integrationsAccountsTable.id,
      integrationType: integrationsAccountsTable.integrationType,
    })
    .from(integrationsAccountsTable)
    .where(
      and(
        eq(integrationsAccountsTable.id, integrationAccountId),
        eq(integrationsAccountsTable.userId, userId),
      ),
    );

  if (!integrationAccount) {
    throw new Error("Integration account not found");
  }

  const tasklistSourceType = integrationAccount.integrationType as TaskSource;

  if (!TASK_SOURCES.includes(tasklistSourceType)) {
    throw new Error("Tasklist source is not supported");
  }

  const taskSource = getTaskSource(tasklistSourceType);

  if (!(taskSource instanceof ReadWriteTaskSource)) {
    throw new Error("Tasklist source is not writable");
  }

  return {
    integrationAccount,
    taskSource,
  };
}

export async function createTaskAction(
  context: ActionContext,
  payload: ActionPayload<typeof TASKS_CREATE_TASK_ACTION>,
): Promise<string> {
  const { integrationAccount, taskSource } = await getValidatedTaskContext(
    context.user.id,
    payload.integrationAccountId,
  );

  const [tasklist] = await db
    .select({
      id: tasklistsTable.id,
    })
    .from(tasklistsTable)
    .where(
      and(
        eq(tasklistsTable.id, payload.tasklistId),
        eq(tasklistsTable.integrationAccountId, integrationAccount.id),
      ),
    );

  if (!tasklist) {
    throw new Error("Tasklist not found");
  }

  const createdTask = await taskSource.createTask(
    integrationAccount.id,
    tasklist.id,
    {
      title: payload.title,
      description: payload.description ?? undefined,
      dueDate: payload.dueDate ? parseDate(payload.dueDate) : undefined,
      attributes: payload.attributes ?? undefined,
    },
  );

  return `Created task with memory id ${createdTask.memoryId} successfully`;
}

export async function updateTaskAction(
  context: ActionContext,
  payload: ActionPayload<typeof TASKS_MODIFY_TASK_ACTION>,
): Promise<string> {
  const { integrationAccount, taskSource } = await getValidatedTaskContext(
    context.user.id,
    payload.integrationAccountId,
  );

  const [memory] = await getMemories(context.user.id, [payload.taskId]);

  if (!memory) {
    throw new Error("Task not found");
  }

  await taskSource.updateTask(integrationAccount.id, payload.taskId, {
    title: payload.title ?? undefined,
    description: payload.description ?? undefined,
    dueDate: payload.dueDate ? parseDate(payload.dueDate) : undefined,
    attributes: payload.attributes ?? undefined,
  });

  return "Updated task successfully";
}

export async function deleteTaskAction(
  context: ActionContext,
  payload: ActionPayload<typeof TASKS_DELETE_TASK_ACTION>,
): Promise<string> {
  const { integrationAccount, taskSource } = await getValidatedTaskContext(
    context.user.id,
    payload.integrationAccountId,
  );

  const [memory] = await getMemories(context.user.id, [payload.taskId]);

  if (!memory) {
    throw new Error("Task not found");
  }

  await taskSource.deleteTask(integrationAccount.id, payload.taskId);

  return "Deleted task successfully";
}
