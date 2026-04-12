import { ChatOpenAI } from "@langchain/openai";
// import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ChatOllama } from "@langchain/ollama";
import { config } from "@/lib/config/env";

export function createLLM() {
//   if (config.LLM_PROVIDER === "huggingface") {
//     return new HuggingFaceInference({
//       apiKey: config.HF_API_KEY,
//       model: config.LLM_MODEL,
//     });
//   }

if (config.LLM_PROVIDER === "ollama") {
  return new ChatOllama({
    model: config.LLM_MODEL,
    baseUrl: config.OLLAMA_BASE_URL,
  });
}


  if (config.LLM_PROVIDER === "openai") {
    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    });
  }

  if (config.LLM_PROVIDER === "together") {
  return new ChatTogetherAI({
    apiKey: config.TOGETHER_API_KEY,
    model: config.LLM_MODEL,
  });
}

  throw new Error(`Unsupported LLM provider: ${config.LLM_PROVIDER}`);
}

  