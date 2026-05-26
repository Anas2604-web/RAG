import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createLLM } from "@/lib/llm/llm-factory";
import { retrieverTool, queryRewriterTool, metadataFilterRetrieverTool } from "./tools";
import { config } from "@/lib/config/env";

export async function createAgent() {
  const llm = createLLM();

  const provider = config.LLM_PROVIDER;
  if (!["groq", "openai", "together", "ollama"].includes(provider)) {
    console.warn(`⚠️ Provider "${provider}" does not support tool calling.`);
    return null;
  }

  const agent = createReactAgent({
    llm,
    tools: [retrieverTool, queryRewriterTool, metadataFilterRetrieverTool],
    messageModifier: `You are a document Q&A assistant. Answer ONLY from uploaded documents.

STRICT RULES:
- ALWAYS call search_documents exactly ONCE before answering
- After getting results, give your final answer immediately — do not search again unless results were completely empty
- If the question cannot be answered from documents (e.g. "how to study", "give me tips"), respond: "I can only answer questions based on the uploaded documents."
- Never answer from general knowledge
- Stay focused — if chunks contain multiple subjects, only use the relevant one
- Maximum searches: 2`,
  });

  // Keep recursion limit low to prevent infinite loops
  return agent.withConfig({ recursionLimit: 6 });
}