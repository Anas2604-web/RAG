import { qdrantClient } from "./qdrant-client";
import { createEmbedder } from "../embeddings/embedder";

const COLLECTION_NAME = "test_collection";

export async function retrieve(query: string) {
  const embedder = createEmbedder();

  const queryVector = await embedder.embedQuery(query);

  const results = await qdrantClient.search(COLLECTION_NAME, {
    vector: queryVector,
    limit: 3,
  });

  return results;
}

  