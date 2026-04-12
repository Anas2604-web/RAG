import { z } from "zod";

const envSchema = z
  .object({
    // LLM Configuration
    LLM_PROVIDER: z.enum(["together", "huggingface", "ollama", "openai"]).default("huggingface"),
    LLM_MODEL: z.string().default("mistralai/Mistral-7B-Instruct-v0.2"),
    TOGETHER_API_KEY: z.string().optional(),
    HF_API_KEY: z.string(),
    OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),

    // Embedding Configuration
    EMBEDDING_PROVIDER: z.enum(["huggingface", "ollama"]).default("huggingface"),
    EMBEDDING_MODEL: z.string().default("BAAI/bge-small-en-v1.5"),

    // Qdrant Configuration
    QDRANT_URL: z.string(),
    QDRANT_API_KEY: z.string().optional(),
    QDRANT_COLLECTION: z.string().default("documents"),

    // Ingestion Configuration
    CHUNK_SIZE: z.coerce.number().default(512),
    CHUNK_OVERLAP: z.coerce.number().default(64),

    // Retrieval Configuration
    RETRIEVER_K: z.coerce.number().default(5),

    // Agent Configuration
    AGENT_MAX_STEPS: z.coerce.number().default(10),

    // Logging Configuration
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

    // Environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  })
  .refine(
    (data) => {
      if (data.LLM_PROVIDER === "together" && !data.TOGETHER_API_KEY) {
        throw new Error("TOGETHER_API_KEY is required when LLM_PROVIDER=together");
      }
      return true;
    },
    { message: "Conditional validation failed" }
  );

let config: z.infer<typeof envSchema>;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    console.error("Environment validation failed:\n", missingVars);
    process.exit(1);
  }
  throw error;
}

export { config };
