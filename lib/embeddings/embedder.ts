import { Embeddings } from "@langchain/core/embeddings";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { config } from "@/lib/config/env";
import { logger } from "@/lib/logger/logger";

class EmbeddingService {
  private embedder: Embeddings;
  private cachedDimension: number | null = null;

  constructor(embedder: Embeddings) {
    this.embedder = embedder;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return this.embedder.embedDocuments(texts);
  }

  async embedQuery(query: string): Promise<number[]> {
    return this.embedder.embedQuery(query);
  }

  async getDimension(): Promise<number> {
    if (this.cachedDimension !== null) {
      return this.cachedDimension;
    }

    // Embed a dummy string to get dimension
    const testVector = await this.embedQuery("test");
    this.cachedDimension = testVector.length;

    logger.debug({
      event: "embedding.dimension_cached",
      provider: config.EMBEDDING_PROVIDER,
      model: config.EMBEDDING_MODEL,
      dimension: this.cachedDimension,
    });

    return this.cachedDimension;
  }
}

let embeddingService: EmbeddingService | null = null;

export function createEmbeddingService(): EmbeddingService {
  if (embeddingService) {
    return embeddingService;
  }

  let embedder: Embeddings;

  if (config.EMBEDDING_PROVIDER === "huggingface") {
    embedder = new HuggingFaceInferenceEmbeddings({
      apiKey: config.HF_API_KEY,
      model: config.EMBEDDING_MODEL,
    });
  } else if (config.EMBEDDING_PROVIDER === "ollama") {
    embedder = new OllamaEmbeddings({
      model: config.EMBEDDING_MODEL,
      baseUrl: config.OLLAMA_BASE_URL,
    });
  } else {
    throw new Error(
      `Unsupported embedding provider: ${config.EMBEDDING_PROVIDER}`
    );
  }

  embeddingService = new EmbeddingService(embedder);

  logger.info({
    event: "embedding_service.initialized",
    provider: config.EMBEDDING_PROVIDER,
    model: config.EMBEDDING_MODEL,
  });

  return embeddingService;
}

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingService) {
    throw new Error("Embedding service not initialized. Call createEmbeddingService() first.");
  }
  return embeddingService;
}
