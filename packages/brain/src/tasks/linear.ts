import { z } from "zod";

import type { Modifiable } from "@kokoro/common/poldash";
import {
  diff,
  diffApplyIndividual,
  keyBySync,
  lookup,
} from "@kokoro/common/poldash";
import { and, eq } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db } from "@kokoro/db/client";
import type {
  SimpleMemoryTaskAttribute,
  SimpleTasklist,
} from "@kokoro/db/schema";
import {
  memoryTable,
  memoryTaskTable,
  tasklistsTable,
} from "@kokoro/db/schema";
import type { LinearIssue, LinearTeam } from "@kokoro/linear";
import { withLinear } from "@kokoro/linear";
import { fetchLinearIssues, fetchLinearTasklists } from "@kokoro/linear/tasks";
import { resolveLinearPaginatedRequest } from "@kokoro/linear/utils";
import { TASK_SYNC_QUEUE, publish } from "@kokoro/queues";
import type { TaskListAttribute, TaskState } from "@kokoro/validators/db";
import { LINEAR } from "@kokoro/validators/db";

import { getMemories, upsertMemory } from "..";
import type {
  ProcessTaskContext,
  ProcessTasklistContext,
  SupportedTaskFields,
} from "./base";
import { ReadWriteTaskSource } from "./base";

// From linear sdk: 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low.

const LINEAR_PRIORITY_ATTRIBUTE: TaskListAttribute = {
  name: "Priority",
  tags: {
    "1": { name: "Urgent", color: "#FF8800FF" },
    "2": { name: "High", color: "#707070FF" },
    "3": { name: "Normal", color: "#707070FF" },
    "4": { name: "Low", color: "#707070FF" },
    "0": { name: "No Priority", color: "#707070FF" },
  },
};

const LINEAR_STATE_ATTRIBUTE_ID = "state";

function getActualLinearPriority(priority: number): number {
  switch (priority) {
    case 0:
      return 0;
    case 1:
      return 99;
    case 2:
      return 10;
    case 3:
      return 2;
    case 4:
      return 1;
    default:
      return -1;
  }
}

// From linear sdk: One of "triage", "backlog", "unstarted", "started", "completed", "canceled".
function getLinearState(state: string): TaskState {
  switch (state) {
    case "triage":
      return "TODO";
    case "backlog":
      return "TODO";
    case "unstarted":
      return "TODO";
    case "started":
      return "IN_PROGRESS";
    case "completed":
      return "COMPLETED";
    default:
      return "TODO";
  }
}

function validateTaskAttributes(
  attributes: Record<string, string>,
  tasklist: SimpleTasklist
) {
  const priorityAttribute = attributes[LINEAR_PRIORITY_ATTRIBUTE.name];
  const stateAttribute = attributes[LINEAR_STATE_ATTRIBUTE_ID];

  // Checking priority
  if (
    priorityAttribute &&
    !Object.keys(
      tasklist.config[LINEAR_PRIORITY_ATTRIBUTE.name]?.tags ?? {}
    ).includes(priorityAttribute)
  ) {
    throw new Error("Invalid priority");
  }

  // Checking state
  if (
    stateAttribute &&
    !Object.keys(
      tasklist.config[LINEAR_STATE_ATTRIBUTE_ID]?.tags ?? {}
    ).includes(stateAttribute)
  ) {
    throw new Error("Invalid state");
  }

  return {
    priorityAttribute,
    stateAttribute,
  };
}

export class LinearTaskSource extends ReadWriteTaskSource<
  LinearTeam,
  LinearIssue
> {
  async processTasklist(
    context: ProcessTasklistContext,
    tasklist: LinearTeam,
    db: TransactableDBType
  ): Promise<{ id: string }> {
    const tasklistState = await resolveLinearPaginatedRequest(
      tasklist.states()
    );

    const formattedTasklist: Omit<SimpleTasklist, "id"> = {
      name: tasklist.name,
      integrationAccountId: context.integrationAccountId,
      platformTaskListId: tasklist.id,
      platformAccountId: context.platformAccountId,
      userId: context.userId,
      source: LINEAR,
      config: {
        [LINEAR_STATE_ATTRIBUTE_ID]: {
          name: "State",
          tags: keyBySync(tasklistState, "id", (state) => ({
            name: state.name,
            color: state.color,
            state: getLinearState(state.type),
          })),
        },
        priority: LINEAR_PRIORITY_ATTRIBUTE,
      },
      color: tasklist.color ?? null,
      hidden: false,
    };

    const [insertedTasklist] = await db
      .insert(tasklistsTable)
      .values(formattedTasklist)
      .onConflictDoUpdate({
        target: [
          tasklistsTable.userId,
          tasklistsTable.source,
          tasklistsTable.platformAccountId,
          tasklistsTable.platformTaskListId,
        ],
        set: formattedTasklist,
      })
      .returning({
        id: tasklistsTable.id,
      })
      .execute();

    if (!insertedTasklist) {
      throw new Error("Failed to create tasklist");
    }

    return { id: insertedTasklist.id };
  }

  syncTasklists(integrationAccountId: string): Promise<void> {
    return withLinear(integrationAccountId, async (account) => {
      const [tasklists, currentTasklists] = await Promise.all([
        fetchLinearTasklists(account),
        db
          .select({
            platformTasklistId: tasklistsTable.platformTaskListId,
          })
          .from(tasklistsTable)
          .where(
            and(
              eq(tasklistsTable.platformAccountId, account.platformAccountId),
              eq(tasklistsTable.source, LINEAR)
            )
          )
          .execute(),
      ]);

      const formattedTasklists = tasklists.map((tasklist) => ({
        platformTasklistId: tasklist.id,
      }));

      const tasklistsDiff = diff(
        currentTasklists,
        formattedTasklists,
        "platformTasklistId"
      );

      const tasklistsLookup = lookup(tasklists, "id");

      const tasklistsToPublishSync: string[] = [];

      await db.transaction(async (tx) => {
        const localProcessItem = async (
          item: (typeof formattedTasklists)[number]
        ) => {
          const team = tasklistsLookup(item.platformTasklistId);

          if (!team) {
            throw new Error("Team not found");
          }

          const tasklist = await this.processTasklist(
            {
              userId: account.userId,
              platformAccountId: account.platformAccountId,
              integrationAccountId,
            },
            team,
            tx
          );

          tasklistsToPublishSync.push(tasklist.id);
        };

        await diffApplyIndividual(tasklistsDiff, {
          onAdd: localProcessItem,
          onUpdate: localProcessItem,
          onRemove: async (item) => {
            await tx
              .delete(tasklistsTable)
              .where(
                and(
                  eq(
                    tasklistsTable.platformTaskListId,
                    item.platformTasklistId
                  ),
                  eq(tasklistsTable.source, LINEAR),
                  eq(tasklistsTable.userId, account.userId)
                )
              );
          },
        });
      });

      await Promise.all(
        tasklistsToPublishSync.map((tasklistId) =>
          publish(TASK_SYNC_QUEUE, {
            integrationAccountId,
            source: LINEAR,
            tasklistId,
          })
        )
      );
    });
  }

  async processItem(
    context: ProcessTaskContext,
    item: LinearIssue,
    db: TransactableDBType
  ): Promise<{ memoryId: string }> {
    const [[existingMemory], issueState] = await Promise.all([
      db
        .select({
          memoryId: memoryTaskTable.memoryId,
          tasklistConfig: tasklistsTable.config,
        })
        .from(memoryTaskTable)
        .innerJoin(
          tasklistsTable,
          eq(tasklistsTable.id, memoryTaskTable.tasklistId)
        )
        .where(
          and(
            eq(memoryTaskTable.source, LINEAR),
            eq(memoryTaskTable.userId, context.userId),
            eq(memoryTaskTable.tasklistId, context.tasklistId),
            eq(memoryTaskTable.platformTaskId, item.id)
          )
        )
        .execute(),
      item.state,
    ]);

    if (issueState && issueState.type === "canceled") {
      // Issue is deleted, we don't sync it

      let memoryId: string | undefined;

      if (existingMemory) {
        const [deletedMemory] = await db
          .delete(memoryTable)
          .where(eq(memoryTable.id, existingMemory.memoryId))
          .returning({
            id: memoryTable.id,
          })
          .execute();

        memoryId = deletedMemory?.id;
      }

      return { memoryId: memoryId ?? "Unknown" };
    }

    const attributes: SimpleMemoryTaskAttribute[] = [
      {
        platformAttributeId: LINEAR_PRIORITY_ATTRIBUTE.name,
        platformValue: String(item.priorityLabel),
        priority: getActualLinearPriority(item.priority),
        state: null,
      },
    ];

    // TODO: Support labels

    // TODO: Support relations (blocked, sub-tasks, parent-tasks)

    if (
      issueState &&
      existingMemory?.tasklistConfig[LINEAR_STATE_ATTRIBUTE_ID]
    ) {
      const stateConfig =
        existingMemory.tasklistConfig[LINEAR_STATE_ATTRIBUTE_ID]?.tags[
          issueState.id
        ];

      attributes.push({
        platformAttributeId: LINEAR_STATE_ATTRIBUTE_ID,
        platformValue: issueState.name,
        state: stateConfig?.state ?? null,
        priority: null,
      });
    }

    const upsertedMemory = await upsertMemory(
      context.userId,
      {
        source: "TASK",
        content: item.title,
        description: item.description,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        memoryId: existingMemory?.memoryId,
        task: {
          integrationAccountId: context.integrationAccountId,
          dueDate: item.dueDate ? new Date(String(item.dueDate)) : null,
          platformAccountId: context.platformAccountId,
          platformTaskListId: context.platformTasklistId,
          platformTaskId: item.id,
          tasklistId: context.tasklistId,
          source: LINEAR,
          attributes,
        },
      },
      db
    );

    return { memoryId: upsertedMemory.id };
  }

  async syncTasks(
    integrationAccountId: string,
    tasklistId: string
  ): Promise<void> {
    const [tasklist] = await db
      .select()
      .from(tasklistsTable)
      .where(eq(tasklistsTable.id, tasklistId));

    if (!tasklist) {
      throw new Error("Tasklist not found");
    }

    await withLinear(integrationAccountId, async (account) => {
      const [tasks, existingTasks] = await Promise.all([
        fetchLinearIssues(account, tasklist.platformTaskListId),
        db
          .select({ platformTaskId: memoryTaskTable.platformTaskId })
          .from(memoryTaskTable)
          .where(
            and(
              eq(memoryTaskTable.tasklistId, tasklistId),
              eq(memoryTaskTable.source, LINEAR)
            )
          ),
      ]);

      const formattedTasks = tasks.map((task) => ({
        platformTaskId: task.id,
      }));

      const tasksDiff = diff(existingTasks, formattedTasks, "platformTaskId");

      const tasksLookup = lookup(tasks, "id");

      await db.transaction(async (tx) => {
        const localProcessItem = async (
          item: (typeof formattedTasks)[number]
        ) => {
          const task = tasksLookup(item.platformTaskId);

          if (!task) {
            throw new Error("Task not found");
          }

          await this.processItem(
            {
              integrationAccountId,
              userId: account.userId,
              platformAccountId: account.platformAccountId,
              platformTasklistId: tasklist.platformTaskListId,
              tasklistId: tasklistId,
            },
            task,
            tx
          );
        };

        await diffApplyIndividual(tasksDiff, {
          onAdd: localProcessItem,
          onUpdate: localProcessItem,
          onRemove: async (item) => {
            await tx
              .delete(memoryTaskTable)
              .where(
                and(
                  eq(memoryTaskTable.platformTaskId, item.platformTaskId),
                  eq(memoryTaskTable.tasklistId, tasklistId)
                )
              );
          },
        });
      });
    });

    await db
      .update(tasklistsTable)
      .set({ lastSynced: new Date() })
      .where(eq(tasklistsTable.id, tasklist.id));
  }

  async fetchPlatformTask(
    integrationAccountId: string,
    platformTaskId: string
  ): Promise<LinearIssue> {
    return withLinear(integrationAccountId, async (account) => {
      return account.client.issue(platformTaskId);
    });
  }

  async createTask(
    integrationAccountId: string,
    tasklistId: string,
    taskData: SupportedTaskFields
  ): Promise<{ memoryId: string }> {
    const [tasklist] = await db
      .select()
      .from(tasklistsTable)
      .where(eq(tasklistsTable.id, tasklistId));

    if (!tasklist) {
      throw new Error("Tasklist not found");
    }

    return withLinear(integrationAccountId, async (account) => {
      if (tasklist.platformAccountId !== account.platformAccountId) {
        throw new Error("Tasklist does not belong to this account");
      }

      const { priorityAttribute, stateAttribute } = validateTaskAttributes(
        taskData.attributes ?? {},
        tasklist
      );

      const createdIssueReq = await account.client.createIssue({
        teamId: tasklist.platformTaskListId,
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: priorityAttribute ? Number(priorityAttribute) : undefined,
        stateId: stateAttribute,
      });

      if (!createdIssueReq.success) {
        throw new Error("Failed to create issue");
      }

      const createdIssue = await createdIssueReq.issue;

      if (!createdIssue) {
        throw new Error("Failed to fetch created issue");
      }

      const processedItem = await this.processItem(
        {
          integrationAccountId,
          userId: account.userId,
          platformAccountId: account.platformAccountId,
          platformTasklistId: tasklist.platformTaskListId,
          tasklistId: tasklist.id,
        },
        createdIssue,
        db
      );

      return processedItem;
    });
  }

  updateTask(
    integrationAccountId: string,
    taskId: string,
    taskData: Modifiable<SupportedTaskFields>
  ): Promise<void> {
    return withLinear(integrationAccountId, async (account) => {
      const [memory] = await getMemories(account.userId, [taskId]);

      if (!memory?.task) {
        throw new Error("Task not found");
      }

      // Get the tasklist to validate attributes
      const [tasklist] = await db
        .select()
        .from(tasklistsTable)
        .where(eq(tasklistsTable.id, memory.task.tasklistId));

      if (!tasklist) {
        throw new Error("Tasklist not found");
      }

      const { priorityAttribute, stateAttribute } = validateTaskAttributes(
        taskData.attributes ?? {},
        tasklist
      );

      const updatedIssueReq = await account.client.updateIssue(
        memory.task.platformTaskId,
        {
          title: taskData.title,
          description: taskData.description,
          dueDate: taskData.dueDate,
          priority: priorityAttribute ? Number(priorityAttribute) : undefined,
          stateId: stateAttribute,
        }
      );

      if (!updatedIssueReq.success) {
        throw new Error("Failed to update issue");
      }

      const updatedIssue = await updatedIssueReq.issue;

      if (!updatedIssue) {
        throw new Error("Failed to fetch updated issue");
      }

      await this.processItem(
        {
          integrationAccountId,
          userId: account.userId,
          platformAccountId: account.platformAccountId,
          platformTasklistId: memory.task.platformTaskListId,
          tasklistId: memory.task.tasklistId,
        },
        updatedIssue,
        db
      );
    });
  }

  deleteTask(integrationAccountId: string, taskId: string): Promise<void> {
    return withLinear(integrationAccountId, async (account) => {
      const [memory] = await getMemories(account.userId, [taskId]);

      if (!memory?.task) {
        throw new Error("Task not found");
      }

      await account.client.deleteIssue(memory.task.platformTaskId);
    });
  }
}
