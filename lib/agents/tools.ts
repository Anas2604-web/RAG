import { tool } from "@langchain/core/tools";
import { z } from "zod"; 
import { retrieve } from "@/lib/vectorstore/retriever";


export const retrieverTool = tool(
  async (input: any) => {
    let query =
      typeof input === "string"
        ? input
        : input?.query?.value || input?.query || "";

    query = String(query).replace(/[{}"]/g, "").trim();

    if (!query || query.length < 3) {
      return JSON.stringify({ context: "", sources: [] });
    }

    console.log("🚀 RAG IS SEARCHING FOR:", query);

    const results = await retrieve(query);

    if (results.length === 0) {
      return JSON.stringify({
        context: "No relevant documents found.",
        sources: [],
      });
    }

    const context = results.map((r) => r.text).join("\n\n");

    const sources = [
      ...new Set(results.map((r) => r.filename || "unknown")),
    ];

    return JSON.stringify({ context, sources });
  },
  {
    name: "search",
    description: "Search the knowledge base",
    schema: z.object({ query: z.string() }),
  }
);