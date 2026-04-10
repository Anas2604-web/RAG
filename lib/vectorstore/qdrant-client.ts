import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "@/lib/config/env";

export class VectorStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VectorStoreError";
  }
}

let qdrantClient: QdrantClient;

try {
  qdrantClient = new QdrantClient({
    url: config.QDRANT_URL,
    apiKey: config.QDRANT_API_KEY,
    timeout: 5000,
  });
} catch (error) {
  throw new VectorStoreError(
    `Failed to initialize Qdrant client: ${error instanceof Error ? error.message : String(error)}`
  );
}

export { qdrantClient };

export async function collectionExists(name: string): Promise<boolean> {
  try {
    await qdrantClient.getCollection(name);
    return true;
  } catch {
    return false;
  }
}

export async function ensureCollection(
  name: string,
  dimension: number
): Promise<void> {
  const exists = await collectionExists(name);

  if (!exists) {
    await qdrantClient.createCollection(name, {
      vectors: {
        size: dimension,
        distance: "Cosine",
      },
    });
  }
}

export async function deleteCollection(name: string): Promise<void> {
  await qdrantClient.deleteCollection(name);
}
