import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { object, z } from "zod";

const envSchema = z
  .object({
    LLM_PROVIDER: z.enum(["together", "huggingface", "ollama"]).default("huggingface"),
    LLM_MODEL: z.string().default("mistralai/Mistral-7B-Instruct-v0.2"),
    TOGETHER_API_KEY: z.string().optional(),
    HF_API_KEY: z.string(),
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

describe("Environment Configuration", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    Object.assign(process.env, originalEnv)
  });

  it("throws error when QDRANT_URL is missing", () => {
    const env = {
      HF_API_KEY: "hf_test",
    };

    expect(() => envSchema.parse(env)).toThrow();
    const error = expect(() => envSchema.parse(env)).toThrow();
  });

  it("throws error when HF_API_KEY is missing", () => {
    const env = {
      QDRANT_URL: "http://localhost:6333",
    };

    expect(() => envSchema.parse(env)).toThrow();
  });

  it("throws error when LLM_PROVIDER=together but TOGETHER_API_KEY is missing", () => {
    const env = {
      LLM_PROVIDER: "together",
      QDRANT_URL: "http://localhost:6333",
      HF_API_KEY: "hf_test",
    };

    expect(() => envSchema.parse(env)).toThrow();
  });

  it("applies default values for optional variables", () => {
    const env = {
      QDRANT_URL: "http://localhost:6333",
      HF_API_KEY: "hf_test",
    };

    const result = envSchema.parse(env);

    expect(result.LOG_LEVEL).toBe("info");
    expect(result.CHUNK_SIZE).toBe(512);
    expect(result.CHUNK_OVERLAP).toBe(64);
    expect(result.RETRIEVER_K).toBe(5);
    expect(result.AGENT_MAX_STEPS).toBe(10);
    expect(result.LLM_PROVIDER).toBe("huggingface");
    expect(result.EMBEDDING_PROVIDER).toBe("huggingface");
  });

  it("coerces string numbers to actual numbers", () => {
    const env = {
      QDRANT_URL: "http://localhost:6333",
      HF_API_KEY: "hf_test",
      CHUNK_SIZE: "1024",
      CHUNK_OVERLAP: "128",
      RETRIEVER_K: "10",
      AGENT_MAX_STEPS: "20",
    };

    const result = envSchema.parse(env);

    expect(result.CHUNK_SIZE).toBe(1024);
    expect(result.CHUNK_OVERLAP).toBe(128);
    expect(result.RETRIEVER_K).toBe(10);
    expect(result.AGENT_MAX_STEPS).toBe(20);
    expect(typeof result.CHUNK_SIZE).toBe("number");
  });

  it("accepts valid complete config", () => {
    const env = {
      LLM_PROVIDER: "huggingface",
      LLM_MODEL: "mistralai/Mistral-7B-Instruct-v0.2",
      HF_API_KEY: "hf_test",
      QDRANT_URL: "http://localhost:6333",
      QDRANT_API_KEY: "test-key",
      QDRANT_COLLECTION: "documents",
      CHUNK_SIZE: "512",
      CHUNK_OVERLAP: "64",
      RETRIEVER_K: "5",
      AGENT_MAX_STEPS: "10",
      LOG_LEVEL: "debug",
      NODE_ENV: "development",
    };

    const result = envSchema.parse(env);

    expect(result.LLM_PROVIDER).toBe("huggingface");
    expect(result.QDRANT_URL).toBe("http://localhost:6333");
    expect(result.LOG_LEVEL).toBe("debug");
  });

  it("allows QDRANT_API_KEY to be optional", () => {
    const env = {
      QDRANT_URL: "http://localhost:6333",
      HF_API_KEY: "hf_test",
    };

    const result = envSchema.parse(env);

    expect(result.QDRANT_API_KEY).toBeUndefined();
  });

  it("allows TOGETHER_API_KEY to be optional when LLM_PROVIDER is not together", () => {
    const env = {
      LLM_PROVIDER: "huggingface",
      QDRANT_URL: "http://localhost:6333",
      HF_API_KEY: "hf_test",
    };

    const result = envSchema.parse(env);

    expect(result.TOGETHER_API_KEY).toBeUndefined();
  });
});
