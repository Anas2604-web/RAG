import { getEmbeddingService } from "./embedder";
import { qdrantClient, VectorStoreError } from "@/lib/vectorstore/qdrant-client";
import { logger } from "@/lib/logger/logger";

export class DimensionMismatchError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DimensionMismatchError";
    }
}

export async function validateDimension(collection: string): Promise<void> {
    try {
        const embeddingService = getEmbeddingService();
        const modelDimension = await embeddingService.getDimension();

        // Get collection info from Qdrant
        const collectionInfo = await qdrantClient.getCollection(collection);
        const vectors = collectionInfo.config?.params?.vectors;

        if (!vectors || !vectors.size) {
            throw new Error(`Collection ${collection} has no vector configuration`);
        }

        const collectionDimension = vectors.size;

        if (modelDimension !== collectionDimension) {
            const error = new DimensionMismatchError(
                `Embedding dimension mismatch: model produces ${modelDimension}-dim but collection expects ${collectionDimension}-dim`
            );
            logger.error({
                event: "dimension_mismatch",
                collection,
                modelDimension,
                collectionDimension,
            });
            throw error;
        }

        logger.debug({
            event: "dimension_validated",
            collection,
            dimension: modelDimension,
        });
    } catch (error) {
        if (error instanceof DimensionMismatchError) {
            throw error;
        }
        // If collection doesn't exist, that's fine — it will be created with the right dimension
        if (error instanceof Error && error.message.includes("not found")) {
            return;
        }
        throw error;
    }
}
