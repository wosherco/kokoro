import { z } from "zod";

export const TASKLIST_SYNC_QUEUE = "tasklist-sync";

export const tasklistSyncSchema = z.object({
  integrationAccountId: z.string(),
  tasklistId: z.string().optional(),
});

export type TasklistSync = z.infer<typeof tasklistSyncSchema>;
