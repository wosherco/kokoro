import { getEmbedding, getMemories } from "@kokoro/brain";
import { eq } from "@kokoro/db";
import { db } from "@kokoro/db/client";
import { memoryTable } from "@kokoro/db/schema";
import type { Consumer } from "@kokoro/queues";
import { FULFILL_EMBEDDING_QUEUE, consume } from "@kokoro/queues";

import { logger } from "../logger";

export const fulfillEmbedding = (): Consumer =>
  consume(
    FULFILL_EMBEDDING_QUEUE,
    async (message) => {
      const memories = await getMemories(message.userId, [message.memoryId]);

      if (memories.length > 0) {
        const memory = memories[0];

        const [contentEmbedding, descriptionEmbedding] = await Promise.all([
          getEmbedding(memory.content),
          memory.description ? getEmbedding(memory.description) : null,
        ]);

        await db
          .update(memoryTable)
          .set({
            contentEmbedding,
            descriptionEmbedding,
          })
          .where(eq(memoryTable.id, memory.id));
      }
    },
    logger,
  );
