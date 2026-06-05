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
  .superRefine((data, ctx) => {
    if (isBuildPhase()) return;

    if (data.LLM_PROVIDER === "together" && !data.TOGETHER_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TOGETHER_API_KEY is required when LLM_PROVIDER=together",
        path: ["TOGETHER_API_KEY"],
      });
    }
    if (data.LLM_PROVIDER === "groq" && !data.GROQ_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GROQ_API_KEY is required when LLM_PROVIDER=groq",
        path: ["GROQ_API_KEY"],
      });
    }
    if (data.LLM_PROVIDER === "openai" && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPENAI_API_KEY is required when LLM_PROVIDER=openai",
        path: ["OPENAI_API_KEY"],
      });
    }
  });

function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export"
  );
}

function buildEnvSource(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    QDRANT_URL: process.env.QDRANT_URL ?? "http://127.0.0.1:6333",
    LLM_PROVIDER: process.env.LLM_PROVIDER ?? "ollama",
    MONGO_URI: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/build",
    AUTH_SECRET:
      process.env.AUTH_SECRET ?? "build-time-placeholder-secret-key-32chars",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  };
}

function parseEnv() {
  const source = isBuildPhase() ? buildEnvSource() : process.env;
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const message = result.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");

    if (isBuildPhase()) {
      console.warn("Build-time env fallback applied:\n", message);
      return envSchema.parse(buildEnvSource());
    }

    console.error("Environment validation failed:\n", message);
    process.exit(1);
  }

  return result.data;
}

const config = parseEnv();

export { config, isBuildPhase };
