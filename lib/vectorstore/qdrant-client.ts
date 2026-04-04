import { QdrantClient } from "@qdrant/js-client-rest";

const url = process.env.QDRANT_URL || "http://localhost:6333";

export const qdrantClient = new QdrantClient({
  url,
});

export async function collectionExists(name: string) {
  try {
    await qdrantClient.getCollection(name);
    return true;
  } catch {
    return false;
  }
}

export async function ensureCollection(name: string, dimension: number) {
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

export async function deleteCollection(name: string) {
  await qdrantClient.deleteCollection(name);
}
