import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "@/lib/config/env";

export class VectorStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VectorStoreError";
  }
}

let client: QdrantClient | null = null;

function getClient(): QdrantClient {
  if (!client) {
    try {
      client = new QdrantClient({
        url: config.QDRANT_URL,
        apiKey: config.QDRANT_API_KEY,
        timeout: 5000,
        checkCompatibility: false,
      });
    } catch (error) {
      throw new VectorStoreError(
        `Failed to initialize Qdrant client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return client;
}

export const qdrantClient: QdrantClient = new Proxy({} as QdrantClient, {
  get(_target, prop) {
    const instance = getClient();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

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

  try {
    await qdrantClient.createPayloadIndex(name, {
      field_name: "documentId",
      field_schema: "keyword",
    });
  } catch {
    console.log("Payload index creation skipped (may already exist)");
  }
}

export async function deleteCollection(name: string): Promise<void> {
  await qdrantClient.deleteCollection(name);
}
