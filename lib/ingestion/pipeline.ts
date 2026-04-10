import { v4 as uuidv4 } from "uuid";
import { parseFile } from "./parser";
import { splitText } from "./splitter";
import { createEmbeddingService } from "@/lib/embeddings/embedder";
import { validateDimension } from "@/lib/embeddings/dimension-validator";
import { qdrantClient, ensureCollection } from "@/lib/vectorstore/qdrant-client";
import { docStore } from "@/lib/docstore/doc-store";
import { config } from "@/lib/config/env";
import { logger } from "@/lib/logger/logger";
import type { DocumentMetaData } from "@/types/index";

export async function ingest(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  collection: string = config.QDRANT_COLLECTION
): Promise<DocumentMetaData> {
  const startTime = Date.now();
  const documentId = uuidv4();

  logger.info({
    event: "ingestion.start",
    filename,
    collection,
    documentId,
  });

  try {
    // 1. Parse file
    logger.debug({ event: "ingestion.parse_start", filename });
    const text = await parseFile(buffer, filename);
    logger.debug({ event: "ingestion.parse_end", textLength: text.length });

    // 2. Split text
    logger.debug({ event: "ingestion.split_start", textLength: text.length });
    const chunks = await splitText(text, config.CHUNK_SIZE, config.CHUNK_OVERLAP);
    logger.debug({ event: "ingestion.split_end", chunkCount: chunks.length });

    // 3. Embed chunks
    logger.debug({ event: "ingestion.embed_start", chunkCount: chunks.length });
    const embeddingService = createEmbeddingService();
    const vectors = await embeddingService.embed(chunks);
    logger.debug({ event: "ingestion.embed_end", vectorCount: vectors.length });

    // 4. Validate dimension
    logger.debug({ event: "ingestion.validate_dimension_start", collection });
    await validateDimension(collection);
    logger.debug({ event: "ingestion.validate_dimension_end" });

    // 5. Ensure collection exists
    const dimension = await embeddingService.getDimension();
    await ensureCollection(collection, dimension);

    // 6. Upsert to Qdrant
    logger.debug({ event: "ingestion.upsert_start", chunkCount: chunks.length });
    const points = chunks.map((chunk, index) => ({
      id: uuidv4(),
      vector: vectors[index],
      payload: {
        documentId,
        filename,
        chunkIndex: index,
        text: chunk,
        tokenCount: Math.ceil(chunk.length / 4),
        uploadedAt: new Date().toISOString(),
        metadata: {},
      },
    }));

    await qdrantClient.upsert(collection, {
      points,
    });
    logger.debug({ event: "ingestion.upsert_end", pointCount: points.length });

    // 7. Save metadata to DocStore
    logger.debug({ event: "ingestion.docstore_save_start" });
    const metadata: DocumentMetaData = {
      id: documentId,
      filename,
      mimeType,
      uploadedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      collection,
      sizeBytes: buffer.length,
    };

    await docStore.saveDocument(metadata);
    logger.debug({ event: "ingestion.docstore_save_end" });

    const durationMs = Date.now() - startTime;
    logger.info({
      event: "ingestion.end",
      filename,
      collection,
      documentId,
      chunkCount: chunks.length,
      durationMs,
    });

    return metadata;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error(
      {
        event: "ingestion.error",
        filename,
        collection,
        documentId,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
      "Ingestion failed"
    );

    // Compensating transaction: delete from Qdrant if DocStore write failed
    try {
      const existingDoc = await docStore.getDocument(documentId);
      if (!existingDoc) {
        // DocStore write failed, so delete from Qdrant
        logger.debug({
          event: "ingestion.compensate_delete",
          documentId,
          collection,
        });
        // Note: In a real system, you'd delete the specific points by documentId
        // For now, this is a placeholder for the compensation logic
      }
    } catch {
      // Ignore compensation errors
    }

    throw error;
  }
}
