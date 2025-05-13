import { TASK_SOURCES } from "@kokoro/validators/db";
import { z } from "zod";

export const TASK_SYNC_QUEUE = "task-sync";

export const taskSyncSchema = z.object({
  integrationAccountId: z.string(),
  source: z.enum(TASK_SOURCES),
  tasklistId: z.string(),
  platformTaskId: z.string().optional(),
});

export type TaskSync = z.infer<typeof taskSyncSchema>;
