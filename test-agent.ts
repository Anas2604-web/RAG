import "dotenv/config";
import { createAgent } from "./lib/agents/agent.js";
import { retrieverTool } from "./lib/agents/tools.js";
import { createLLM } from "./lib/llm/llm-factory.js";

async function run() {
  const agent = await createAgent();
  const llm = createLLM();

  const query = "Explain React in simple terms";

  console.log("🤖 Step 1: Running System...\n");

  if (agent) {
    console.log("🧠 Using REAL AGENT\n");

    const result = await agent.invoke({
      messages: [{ role: "user", content: query }],
    });

    const lastMsg = result.messages[result.messages.length - 1];
    const output =
      typeof lastMsg.content === "string"
        ? lastMsg.content
        : JSON.stringify(lastMsg.content);

    console.log("\n🔥 FINAL ANSWER (Agent):\n", output);
    return;
  }

  console.log("⚠️ Agent not supported → using fallback RAG\n");

  const context = await retrieverTool.invoke({ query });

  console.log("📦 Retrieved Context:\n", context);

  const final = await llm.invoke([
  {
    role: "system",
    content: `
    You are a helpful teacher.

    Use ONLY the provided context to answer the question.

    Rules:
    - Explain in simple, clear language
    - Do NOT return JSON
    - Give a proper explanation (3-5 lines)
    - If context is available, use it fully

    Answer like you are teaching a beginner.
    `,
  },
  {
    role: "user",
    content: `Context:\n${context}\n\nQuestion:\n${query}`,
  },
]);

  console.log("\n🔥 FINAL ANSWER (Fallback RAG):\n");
  console.log(final.content);
}

run();