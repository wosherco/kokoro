import { env } from "../env";

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${env.EMBEDDING_SERVICE_URL}/embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get embedding ${response.status} ${response.statusText}`,
    );
  }

  const { embedding } = (await response.json()) as unknown as {
    embedding: number[];
  };

  return embedding;
}
