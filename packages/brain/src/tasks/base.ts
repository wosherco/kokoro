import type { Modifiable } from "@kokoro/common/poldash";
import type { TransactableDBType } from "@kokoro/db/client";

export interface ProcessTasklistContext {
  userId: string;
  platformAccountId: string;
  integrationAccountId: string;
}

export interface ProcessTaskContext {
  integrationAccountId: string;
  userId: string;
  platformAccountId: string;
  platformTasklistId: string;
  tasklistId: string;
}

export abstract class ReadOnlyTaskSource<PlatformTasklist, PlatformItem> {
  abstract processTasklist(
    context: ProcessTasklistContext,
    tasklist: PlatformTasklist,
    db: TransactableDBType,
  ): Promise<{ id: string }>;

  abstract syncTasklists(integrationAccountId: string): Promise<void>;

  abstract processItem(
    context: ProcessTaskContext,
    item: PlatformItem,
    db: TransactableDBType,
  ): Promise<{ memoryId: string }>;

  abstract syncTasks(
    integrationAccountId: string,
    tasklistId: string,
  ): Promise<void>;

  abstract fetchPlatformTask(
    integrationAccountId: string,
    platformTaskId: string,
  ): Promise<PlatformItem>;
}

export interface SupportedTaskFields {
  title: string;
  description?: string;
  dueDate?: Date;
  attributes?: Record<string, string>;
}

export abstract class ReadWriteTaskSource<
  PlatformTasklist,
  PlatformItem,
  PlatformTaskFields extends SupportedTaskFields = SupportedTaskFields,
> extends ReadOnlyTaskSource<PlatformTasklist, PlatformItem> {
  abstract createTask(
    integrationAccountId: string,
    tasklistId: string,
    taskData: PlatformTaskFields,
  ): Promise<{ memoryId: string }>;
  abstract updateTask(
    integrationAccountId: string,
    taskId: string,
    taskData: Modifiable<PlatformTaskFields>,
  ): Promise<void>;
  abstract deleteTask(
    integrationAccountId: string,
    taskId: string,
  ): Promise<void>;
}
