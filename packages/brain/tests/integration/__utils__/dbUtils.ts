import { eq, type InferInsertModel } from "@kokoro/db";
import {
  calendarTable,
  integrationsAccountsTable,
  memoryEventTable,
  memoryTable,
  memoryTaskTable,
  tasklistsTable,
  userTable,
} from "@kokoro/db/schema";
import { db } from "@kokoro/db/client";
import { GOOGLE_CALENDAR, LINEAR_INTEGRATION } from "@kokoro/validators/db";
import { nanoid } from "nanoid";
import { type TEST_EMBEDDING_TEXTS, TEST_EMBEDDINGS } from "./embeddings";
import { afterAll, beforeAll } from "vitest";

// biome-ignore lint/suspicious/noExplicitAny: needed for inference
export type AwaitedReturnType<T extends (...args: any) => any> = Awaited<
  ReturnType<T>
>;

export async function createTestUser(user: InferInsertModel<typeof userTable>) {
  const [createdUser] = await db.insert(userTable).values(user).returning();

  if (!createdUser) {
    throw new Error("Failed to create user");
  }

  return createdUser;
}

export async function createGoogleCalendarIntegration(
  userId: string,
  overrideValues?: Partial<InferInsertModel<typeof integrationsAccountsTable>>
) {
  const [createdIntegration] = await db
    .insert(integrationsAccountsTable)
    .values({
      userId,
      integrationType: GOOGLE_CALENDAR,
      platformAccountId: nanoid(),
      email: "googlecalendarintegration@example.com",
      platformDisplayName: "Google Calendar Integration",
      platformData: {
        syncToken: "google_calendar_sync_token",
        lastSynced: new Date().toISOString(),
      },
      accessToken: "google_calendar_access_token",
      refreshToken: "google_calendar_refresh_token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ...overrideValues,
    })
    .returning();

  if (!createdIntegration) {
    throw new Error("Failed to create Google Calendar integration");
  }

  return createdIntegration;
}

export async function createCalendar(
  userId: string,
  integrationAccountId: string,
  platformAccountId: string,
  overrideValues?: Partial<InferInsertModel<typeof calendarTable>>
) {
  const [createdCalendar] = await db
    .insert(calendarTable)
    .values({
      userId,
      source: GOOGLE_CALENDAR,
      integrationAccountId,
      summary: "Test Calendar",
      platformAccountId,
      platformCalendarId: nanoid(),
      platformData: {
        primary: true,
        accessRole: "owner",
      },
      eventsSyncToken: "google_calendar_events_sync_token",
      ...overrideValues,
    })
    .returning();

  if (!createdCalendar) {
    throw new Error("Failed to create calendar");
  }

  return createdCalendar;
}

export async function createLinearIntegration(
  userId: string,
  overrideValues?: Partial<InferInsertModel<typeof integrationsAccountsTable>>
) {
  const [createdIntegration] = await db
    .insert(integrationsAccountsTable)
    .values({
      userId,
      integrationType: LINEAR_INTEGRATION,
      platformAccountId: nanoid(),
      email: "linearintegration@example.com",
      platformDisplayName: "Linear Integration",
      platformData: {
        workspaceId: "linear_workspace_id",
      },
      accessToken: "linear_access_token",
      refreshToken: "linear_refresh_token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ...overrideValues,
    })
    .returning();

  if (!createdIntegration) {
    throw new Error("Failed to create Linear integration");
  }

  return createdIntegration;
}

export async function createTasklist(
  userId: string,
  integrationAccountId: string,
  platformAccountId: string,
  overrideValues?: Partial<InferInsertModel<typeof tasklistsTable>>
) {
  const [createdTasklist] = await db
    .insert(tasklistsTable)
    .values({
      userId,
      integrationAccountId,
      platformAccountId,
      platformTaskListId: nanoid(),
      source: LINEAR_INTEGRATION,
      name: "Test Tasklist",
      ...overrideValues,
    })
    .returning();

  if (!createdTasklist) {
    throw new Error("Failed to create tasklist");
  }

  return createdTasklist;
}

export async function createMemory(
  userId: string,
  contentKey: (typeof TEST_EMBEDDING_TEXTS)[number],
  descriptionKey: (typeof TEST_EMBEDDING_TEXTS)[number],
  parameters: {
    event?: Omit<
      InferInsertModel<typeof memoryEventTable>,
      "memoryId" | "userId"
    >;
    task?: Omit<
      InferInsertModel<typeof memoryTaskTable>,
      "memoryId" | "userId"
    >;
  }
) {
  const { event, task } = parameters;

  const contentEmbedding = TEST_EMBEDDINGS[contentKey];
  const descriptionEmbedding = TEST_EMBEDDINGS[descriptionKey];

  const [createdMemory] = await db
    .insert(memoryTable)
    .values({
      userId,
      // This is deprecated, so it doesn't matter.
      source: "CALENDAR",
      content: contentKey,
      contentEmbedding,
      description: descriptionKey,
      descriptionEmbedding,
      createdAt: new Date(),
      lastUpdate: new Date(),
    })
    .returning();

  if (!createdMemory) {
    throw new Error("Failed to create memory");
  }

  if (event) {
    const [createdEvent] = await db
      .insert(memoryEventTable)
      .values({
        ...event,
        userId,
        memoryId: createdMemory.id,
      })
      .returning();

    if (!createdEvent) {
      throw new Error("Failed to create memory event");
    }

    return {
      memory: createdMemory,
      event: createdEvent,
    };
  }

  if (task) {
    const [createdTask] = await db
      .insert(memoryTaskTable)
      .values({
        ...task,
        userId,
        memoryId: createdMemory.id,
      })
      .returning();

    if (!createdTask) {
      throw new Error("Failed to create memory task");
    }

    return {
      memory: createdMemory,
      task: createdTask,
    };
  }

  return {
    memory: createdMemory,
  };
}

export function useTestMemory(props: () => Parameters<typeof createMemory>) {
  let memory: AwaitedReturnType<typeof createMemory>;

  beforeAll(async () => {
    const [userId, contentKey, descriptionKey, parameters] = props();
    memory = await createMemory(userId, contentKey, descriptionKey, parameters);

    return async () => {
      if (memory.event) {
        await db
          .delete(memoryEventTable)
          .where(eq(memoryEventTable.id, memory.event.id));
      }

      if (memory.task) {
        await db
          .delete(memoryTaskTable)
          .where(eq(memoryTaskTable.id, memory.task.id));
      }

      await db.delete(memoryTable).where(eq(memoryTable.id, memory.memory.id));
    };
  });

  return () => memory;
}
