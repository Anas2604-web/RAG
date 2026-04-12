import { tool } from "@langchain/core/tools";
import { z } from "zod"; 
import { retrieve } from "@/lib/vectorstore/retriever";

let lastQuery = "";

export const retrieverTool = tool(
  async (input: any) => {
    let query =
      typeof input === "string"
      ? input
      : input?.query?.value ||
        input?.query ||
        "";

    query = String(query).replace(/[{}"]/g, "").trim();

    if (!query || query.length < 3) {
      console.log("Skipping invalid query:", query);
      return "Invalid query. Do not search again.";
    }

    if (query === lastQuery) {
      return "Repeated query detected. Do not search again.";
    }

    lastQuery = query;

    console.log("🚀 RAG IS SEARCHING FOR:", query);
    
    const results = await retrieve(query);
    
    if (results.length === 0) {
      return "No relevant documents found for this query. Please do not search for this again.";
    }

    const context = results.map((r) => `[Source: ${r.filename}]: ${r.text}`).join("\n\n");
    return context;
  },
  {
    name: "search",
    description: "Search the knowledge base for React facts",
    schema: z.object({ query: z.string() }),
  }
);
