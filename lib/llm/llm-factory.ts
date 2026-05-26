import { ChatOpenAI } from "@langchain/openai";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";
import { config } from "@/lib/config/env";

export function createLLM() {
  switch (config.LLM_PROVIDER) {
    case "groq":
      return new ChatGroq({
        apiKey: config.GROQ_API_KEY,
        model: config.LLM_MODEL ?? "llama-3.3-70b-versatile",
        temperature: 0,
      });

    case "openai":
      return new ChatOpenAI({
        apiKey: config.OPENAI_API_KEY,
        model: config.LLM_MODEL ?? "gpt-4o-mini",
        temperature: 0,
      });

    case "together":
      return new ChatTogetherAI({
        apiKey: config.TOGETHER_API_KEY,
        model: config.LLM_MODEL,
        temperature: 0,
      });

    case "ollama":
      return new ChatOllama({
        model: config.LLM_MODEL,
        baseUrl: config.OLLAMA_BASE_URL,
        temperature: 0,
      });

    default:
      throw new Error(`Unsupported LLM provider: ${config.LLM_PROVIDER}`);
  }
}