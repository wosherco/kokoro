import { z } from "zod";

import {
  integrationAccountIdSchema,
  taskIdSchema,
  tasklistIdSchema,
} from "./common";

export const TASKS_CREATE_TASK_ACTION = "TASKS:createTask";

export const tasksCreateTaskSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  tasklistId: tasklistIdSchema,
  title: z.string().describe("The title of the task."),
  description: z
    .string()
    .optional()
    .describe("The description of the task. Can use markdown."),
  dueDate: z
    .string()
    .optional()
    .describe("The due date of the task. Must be in ISO 8601 format."),
  attributes: z
    .record(
      z.string().describe("The id of the attribute"),
      z.string().describe("The value of the attribute")
    )
    .optional(),
});

export const TASKS_MODIFY_TASK_ACTION = "TASKS:modifyTask";

export const tasksModifyTaskSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  taskId: taskIdSchema,
  title: z.string().optional().describe("The title of the task."),
  description: z
    .string()
    .optional()
    .describe("The description of the task. Can use markdown."),
  dueDate: z
    .string()
    .optional()
    .describe("The due date of the task. Must be in ISO 8601 format."),
  attributes: z
    .record(
      z.string().describe("The id of the attribute"),
      z.string().describe("The value of the attribute")
    )
    .optional(),
});

export const TASKS_DELETE_TASK_ACTION = "TASKS:deleteTask";

export const tasksDeleteTaskSchema = z.object({
  integrationAccountsTable: integrationAccountIdSchema,
  taskId: taskIdSchema,
});

export const TasksActions = [
  TASKS_CREATE_TASK_ACTION,
  TASKS_MODIFY_TASK_ACTION,
  TASKS_DELETE_TASK_ACTION,
] as const;

export const TasksActionSchemas = {
  [TASKS_CREATE_TASK_ACTION]: tasksCreateTaskSchema,
  [TASKS_MODIFY_TASK_ACTION]: tasksModifyTaskSchema,
  [TASKS_DELETE_TASK_ACTION]: tasksDeleteTaskSchema,
} as const;
