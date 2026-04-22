import { qdrantClient, VectorStoreError } from "./qdrant-client";
import { createEmbeddingService } from "@/lib/embeddings/embedder";
import { logger } from "@/lib/logger/logger";
import { config } from "@/lib/config/env";
import type { DocumentChunk, MetaDataFilter } from "@/types/index";

export async function retrieve(
  query: string,
  k: number = config.RETRIEVER_K,
  filter?: MetaDataFilter,
  collection: string = config.QDRANT_COLLECTION
): Promise<DocumentChunk[]> {
  const startTime = Date.now();

  try {
    // Embed the query
    const embedder = createEmbeddingService();
    const queryVector = await embedder.embedQuery(query);

    // Search Qdrant
    const results = await qdrantClient.search(collection, {
      vector: queryVector,
      limit: k,
      filter: filter,
    });

    // Map results to DocumentChunk[]
    const chunks: DocumentChunk[] = results.map((result) => ({
      id: result.id as string,
      documentId: (result.payload?.documentId as string) || "",
      filename: (result.payload?.filename as string) || "",
      collection,
      chunkIndex: (result.payload?.chunkIndex as number) || 0,
      text: (result.payload?.text as string) || "",
      tokenCount: (result.payload?.tokenCount as number) || 0,
      metadata: (result.payload?.metadata as Record<string, unknown>) || {},
    }));

    // Log retrieval
    const durationMs = Date.now() - startTime;
    logger.debug({
      event: "retriever.search",
      query,
      k,
      resultCount: chunks.length,
      collection,
      durationMs,
    });

    return chunks;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error(
      {
        event: "retriever.error",
        query,
        k,
        collection,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
      "Retrieval failed"
    );
    throw new VectorStoreError(
      `Retrieval failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
