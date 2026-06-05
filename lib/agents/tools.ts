import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retrieve } from "@/lib/vectorstore/retriever";
import { createLLM } from "@/lib/llm/llm-factory";
import { config } from "@/lib/config/env";

// Module-level filter — set per-request before agent runs
let activeDocumentFilter: Record<string, unknown> | null = null;

export function setActiveDocumentFilter(filter: Record<string, unknown>) {
  activeDocumentFilter = filter;
}

export function clearActiveDocumentFilter() {
  activeDocumentFilter = null;
}

// ─── Tool 1: Main semantic retriever ────────────────────────────────────────
export const retrieverTool = tool(
  async (input: { query: string; k?: number }) => {
    const query = String(input.query ?? "").trim();
    if (!query || query.length < 2) return "Query too short — please provide more detail.";

    console.log("🔍 [retriever] query:", query, "| filter:", activeDocumentFilter ? "active" : "none");

    const results = await retrieve(
      query,
      input.k ?? config.RETRIEVER_K,
      activeDocumentFilter ?? undefined
    );

    if (results.length === 0) return "No relevant content found. Try rephrasing or use rewrite_query.";

    return results
      .map((r, i) => `[${i + 1}] File: ${r.filename} | Chunk: ${r.chunkIndex}\n${r.text}`)
      .join("\n\n---\n\n");
  },
  {
    name: "search_documents",
    description:
      "Search the uploaded documents using semantic similarity. Always call this first before answering. Returns relevant text chunks from the documents.",
    schema: z.object({
      query: z.string().describe("What to search for in the documents"),
      k: z.number().int().min(1).max(20).optional().describe("How many results to return (default 5)"),
    }),
  }
);

// ─── Tool 2: Query rewriter ──────────────────────────────────────────────────
export const queryRewriterTool = tool(
  async (input: { query: string }) => {
    const llm = createLLM();

    const response = await llm.invoke([
      {
        role: "system",
        content:
          "You are a search query optimizer. Given a user question, return a JSON array of 2-3 alternative search queries that would help find relevant information in a document database. Return ONLY valid JSON array of strings, nothing else.",
      },
      {
        role: "user",
        content: `Original question: "${input.query}"\n\nReturn JSON array of alternative search queries:`,
      },
    ]);

    try {
      const text =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      const cleaned = text.replace(/```json|```/g, "").trim();
      const alternatives: string[] = JSON.parse(cleaned);
      // Return the best alternative to search next
      return `Rewritten queries: ${alternatives.join(" | ")}. Now search for the most promising one.`;
    } catch {
      return `Try searching for: ${input.query} (rewrite failed, use original)`;
    }
  },
  {
    name: "rewrite_query",
    description:
      "Rewrite the search query into better alternatives when search_documents returns poor or no results. Returns improved query phrasings to try.",
    schema: z.object({
      query: z.string().describe("The original query that returned poor results"),
    }),
  }
);

// ─── Tool 3: Metadata / filename filter retriever ───────────────────────────
export const metadataFilterRetrieverTool = tool(
  async (input: { query: string; filename?: string; k?: number }) => {
    const query = String(input.query ?? "").trim();

    // Layer a filename filter on top of the active document filter
    let filter: Record<string, unknown> | null = activeDocumentFilter;

    if (input.filename) {
      const filenameCondition = { key: "filename", match: { value: input.filename } };
      filter = activeDocumentFilter
        ? { must: [activeDocumentFilter, filenameCondition] }
        : { must: [filenameCondition] };
    }

    console.log("🔎 [filtered retriever] query:", query, "| filename:", input.filename ?? "any");

    const results = await retrieve(query, input.k ?? config.RETRIEVER_K, filter ?? undefined);

    if (results.length === 0) return `No results found in file "${input.filename}". Try search_documents without a filename filter.`;

    return results
      .map((r, i) => `[${i + 1}] File: ${r.filename} | Chunk: ${r.chunkIndex}\n${r.text}`)
      .join("\n\n---\n\n");
  },
  {
    name: "search_specific_file",
    description:
      "Search within a specific file by name. Use this when the user explicitly mentions a particular document or filename.",
    schema: z.object({
      query: z.string().describe("What to search for"),
      filename: z.string().optional().describe("The filename to restrict search to"),
      k: z.number().int().min(1).max(20).optional().describe("Number of results (default 5)"),
    }),
  }
);