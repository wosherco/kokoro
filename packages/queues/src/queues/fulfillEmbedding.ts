import { z } from "zod";

export const FULFILL_EMBEDDING_QUEUE = "fulfill-embedding";

export const fulfillEmbeddingSchema = z.object({
  userId: z.string().uuid(),
  memoryId: z.string().uuid(),
});

// If other types of embeddings are needed, add with "or" to schema?

export type FulfillEmbedding = z.infer<typeof fulfillEmbeddingSchema>;
