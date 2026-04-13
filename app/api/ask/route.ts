import { NextRequest, NextResponse } from "next/server";
import { retrieverTool } from "@/lib/agents/tools";
import { createLLM } from "@/lib/llm/llm-factory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const llm = createLLM();

    const toolRaw = await retrieverTool.invoke({ query });
    const { context, sources } = JSON.parse(toolRaw as string);

    const response = await llm.invoke([
      {
        role: "system",
        content: `
        You are a helpful teacher.

        Use ONLY the provided context to answer the question.

        Rules:
        - Use simple, clear language
        - Do NOT use Markdown (no *, **, #, bullets)
        - Do NOT use special symbols like * or /
        - Write in clean plain text
        - Use short paragraphs (3–5 lines)
        - Make it easy for beginners to understand
        - If context exists, base your answer on it

        Answer like you are explaining to a beginner.
        `,
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${query}`,
      },
    ]);

    const answer =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}