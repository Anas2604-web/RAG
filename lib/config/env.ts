import { z } from "zod";

const envSchema = z
  .object({
    LLM_PROVIDER: z.enum(["together", "huggingface", "ollama", "openai", "groq"]).default("groq"),
    LLM_MODEL: z.string().default("llama-3.3-70b-versatile"),
    TOGETHER_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    HF_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),

    EMBEDDING_PROVIDER: z.enum(["huggingface", "ollama"]).default("huggingface"),
    EMBEDDING_MODEL: z.string().default("BAAI/bge-small-en-v1.5"),

    QDRANT_URL: z.string(),
    QDRANT_API_KEY: z.string().optional(),
    QDRANT_COLLECTION: z.string().default("documents"),

    CHUNK_SIZE: z.coerce.number().default(512),
    CHUNK_OVERLAP: z.coerce.number().default(64),
    RETRIEVER_K: z.coerce.number().default(5),
    AGENT_MAX_STEPS: z.coerce.number().default(10),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    MONGO_URI: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    NEXTAUTH_URL: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.LLM_PROVIDER === "together" && !data.TOGETHER_API_KEY)
        throw new Error("TOGETHER_API_KEY is required when LLM_PROVIDER=together");
      if (data.LLM_PROVIDER === "groq" && !data.GROQ_API_KEY)
        throw new Error("GROQ_API_KEY is required when LLM_PROVIDER=groq");
      if (data.LLM_PROVIDER === "openai" && !data.OPENAI_API_KEY)
        throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
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