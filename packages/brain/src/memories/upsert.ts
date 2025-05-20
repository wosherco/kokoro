import { diff, diffApply, diffApplyIndividual } from "@kokoro/common/poldash";
import { and, eq, inArray } from "@kokoro/db";
import type { TransactableDBType } from "@kokoro/db/client";
import { db as dbClient } from "@kokoro/db/client";
import type {
  MemorySource,
  RecurringInstanceMemoryEvent,
  RecurringMemoryEvent,
  RecurringMemoryTask,
  SimpleMemoryEvent,
  SimpleMemoryEventAttendant,
  SimpleMemoryTask,
  SimpleMemoryTaskAttribute,
} from "@kokoro/db/schema";
import {
  memoryEventAttendantsTable,
  memoryEventTable,
  memoryTable,
  memoryTaskAttributeTable,
  memoryTaskTable,
} from "@kokoro/db/schema";

import { getEmbedding } from "../embeddings";
interface UpsertMemoryOptions {
  source: MemorySource;
  content: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  /**
   * Only provide if updating an existing memory
   */
  memoryId?: string;
  relations?: {
    interactionId?: string;
  };
  /**
   * You can just provide event or task, not both
   */
  event?:
    | SimpleMemoryEvent
    | RecurringMemoryEvent
    | RecurringInstanceMemoryEvent;
  /**
   * You can just provide event or task, not both
   */
  task?: SimpleMemoryTask | RecurringMemoryTask;
  embeddings?: boolean;
}

export async function upsertMemory(
  userId: string,
  options: UpsertMemoryOptions,
  db: TransactableDBType = dbClient,
) {
  const {
    content,
    description,
    source,
    memoryId,
    relations,
    createdAt,
    updatedAt,
    event,
    task,
    embeddings = true,
  } = options;

  if (event && task) {
    throw new Error("You can only provide one of event or task");
  }

  const [contentEmbedding, descriptionEmbedding] = await Promise.all([
    embeddings ? getEmbedding(content) : null,
    embeddings && description ? getEmbedding(description) : null,
  ]);

  const values = {
    content,
    contentEmbedding,
    description,
    descriptionEmbedding,
    source,
    createdAt,
    updatedAt,
  };

  const updateMemoryEvent = async (memoryId: string) => {
    if (!event) {
      return {};
    }

    const [memoryEvent] = await db
      .insert(memoryEventTable)
      .values({
        ...event,
        userId,
        memoryId,
      })
      .onConflictDoUpdate({
        target: [memoryEventTable.memoryId],
        set: {
          ...event,
          userId,
          memoryId,
        },
      })
      .returning({
        memoryEventId: memoryEventTable.id,
      });

    if (event.attendees && memoryEvent) {
      // Get existing attendees
      const existingAttendees = await db
        .select()
        .from(memoryEventAttendantsTable)
        .where(
          eq(
            memoryEventAttendantsTable.memoryEventId,
            memoryEvent.memoryEventId,
          ),
        );

      const attendeesDiff = diff(
        existingAttendees as SimpleMemoryEventAttendant[],
        event.attendees,
        "email",
        (existing, attendee) =>
          existing.comment !== attendee.comment ||
          existing.displayName !== attendee.displayName ||
          existing.optional !== attendee.optional ||
          existing.organizer !== attendee.organizer ||
          existing.status !== attendee.status ||
          existing.self !== attendee.self,
      );

      await diffApply(attendeesDiff, {
        async onRemove(items) {
          await db.delete(memoryEventAttendantsTable).where(
            and(
              eq(
                memoryEventAttendantsTable.memoryEventId,
                memoryEvent.memoryEventId,
              ),
              inArray(
                memoryEventAttendantsTable.email,
                items.map((item) => item.email),
              ),
            ),
          );
        },
        async onAdd(items) {
          await db.insert(memoryEventAttendantsTable).values(
            items.map((item) => ({
              ...item,
              id: undefined,
              userId,
              memoryEventId: memoryEvent.memoryEventId,
            })),
          );
        },
      });

      await diffApplyIndividual(attendeesDiff, {
        async onUpdate(item) {
          await db
            .update(memoryEventAttendantsTable)
            .set({
              ...item,
              id: undefined,
            })
            .where(
              and(
                eq(
                  memoryEventAttendantsTable.memoryEventId,
                  memoryEvent.memoryEventId,
                ),
                eq(memoryEventAttendantsTable.email, item.email),
              ),
            );
        },
      });
    }

    return memoryEvent ?? {};
  };

  const updateMemoryTask = async (memoryId: string) => {
    if (!task) {
      return {};
    }

    const [memoryTask] = await db
      .insert(memoryTaskTable)
      .values({ ...task, userId, memoryId })
      .onConflictDoUpdate({
        target: [
          memoryTaskTable.source,
          memoryTaskTable.platformTaskId,
          memoryTaskTable.platformTaskListId,
          memoryTaskTable.platformAccountId,
          memoryTaskTable.userId,
        ],
        set: { ...task, userId, memoryId },
      })
      .returning({
        id: memoryTaskTable.id,
        integrationAccountId: memoryTaskTable.integrationAccountId,
        platformTaskId: memoryTaskTable.platformTaskId,
        platformTaskListId: memoryTaskTable.platformTaskListId,
        platformAccountId: memoryTaskTable.platformAccountId,
        tasklistId: memoryTaskTable.tasklistId,
        source: memoryTaskTable.source,
      });

    if (memoryTask) {
      const currentAttributes = await db
        .select()
        .from(memoryTaskAttributeTable)
        .where(eq(memoryTaskAttributeTable.memoryTaskId, memoryTask.id));

      const attributesDiff = diff(
        currentAttributes as SimpleMemoryTaskAttribute[],
        task.attributes,
        "platformAttributeId",
        (existing, attribute) =>
          existing.state !== attribute.state ||
          existing.priority !== attribute.priority ||
          existing.platformValue !== attribute.platformValue,
      );

      await diffApply(attributesDiff, {
        async onRemove(items) {
          await db.delete(memoryTaskAttributeTable).where(
            and(
              eq(memoryTaskAttributeTable.memoryTaskId, memoryTask.id),
              inArray(
                memoryTaskAttributeTable.platformAttributeId,
                items.map((item) => item.platformAttributeId),
              ),
            ),
          );
        },
        async onAdd(items) {
          await db.insert(memoryTaskAttributeTable).values(
            items.map((item) => ({
              ...item,
              userId,
              memoryTaskId: memoryTask.id,
              integrationAccountId: memoryTask.integrationAccountId,
              platformAccountId: memoryTask.platformAccountId,
              platformTaskListId: memoryTask.platformTaskListId,
              platformTaskId: memoryTask.platformTaskId,
              tasklistId: memoryTask.tasklistId,
              source: memoryTask.source,
            })),
          );
        },
      });

      await diffApplyIndividual(attributesDiff, {
        async onUpdate(item) {
          await db
            .update(memoryTaskAttributeTable)
            .set({
              ...item,
              platformAttributeId: undefined,
            })
            .where(
              and(
                eq(memoryTaskAttributeTable.memoryTaskId, memoryTask.id),
                eq(
                  memoryTaskAttributeTable.platformAttributeId,
                  item.platformAttributeId,
                ),
              ),
            );
        },
      });
    }

    return memoryTask?.id ? { memoryTaskId: memoryTask.id } : {};
  };

  const handleUpdates = async (
    memoryId: string,
  ): Promise<{ memoryEventId?: string; memoryTaskId?: string }> => {
    const newIds = await Promise.all([
      updateMemoryEvent(memoryId),
      updateMemoryTask(memoryId),
    ]);

    return newIds.reduce((acc, curr) => {
      return {
        // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
        ...acc,
        ...curr,
      };
    }, {});
  };

  if (memoryId !== undefined) {
    const [updatedMemory] = await db
      .update(memoryTable)
      .set({
        ...values,
      })
      .where(and(eq(memoryTable.id, memoryId), eq(memoryTable.userId, userId)))
      .returning({
        id: memoryTable.id,
      });

    if (!updatedMemory) {
      throw new Error("Failed to update memory");
    }

    const updatesData = await handleUpdates(updatedMemory.id);

    return {
      ...updatedMemory,
      ...updatesData,
    };
  }

  const [memory] = await db
    .insert(memoryTable)
    .values({
      userId,
      ...values,
      ...relations,
    })
    .returning({
      id: memoryTable.id,
    });

  if (!memory) {
    throw new Error("Failed to create memory");
  }

  const updatesData = await handleUpdates(memory.id);

  return {
    ...memory,
    ...updatesData,
  };
}
