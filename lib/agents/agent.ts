import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createLLM } from "@/lib/llm/llm-factory";
import { retrieverTool } from "./tools";

export async function createAgent() {
  const llm = createLLM();

  const provider = process.env.LLM_PROVIDER;

  if (["openai", "anthropic", "together"].includes(provider!)) {
    const agent = await createReactAgent({
      llm,
      tools: [retrieverTool],
    });

    return agent.withConfig({
      recursionLimit: 5,
    });
  }

  // FALLBACK MODE
  return null;
}