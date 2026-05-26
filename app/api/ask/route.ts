import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { retrieve } from "@/lib/vectorstore/retriever";
import { createLLM } from "@/lib/llm/llm-factory";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";
import { createAgent } from "@/lib/agents/agent";
import { setActiveDocumentFilter, clearActiveDocumentFilter } from "@/lib/agents/tools";
import type { Citation } from "@/types/index";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { query, sessionId, documentIds } = body;

    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    await connectDB();

    const chatSession = await ChatSession.findOne({ _id: sessionId, userId: session.user.id });
    if (!chatSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    chatSession.messages.push({
      role: "user", content: query, citations: [], trace: [], createdAt: new Date(),
    } as never);
    await chatSession.save();

    // ── Guards ───────────────────────────────────────────────────────────────
    const sessionDocumentIds = chatSession.documents.map((doc: any) => doc.documentId);
    if (sessionDocumentIds.length === 0) {
      const answer = "Please upload documents to this session before asking questions.";
      chatSession.messages.push({ role: "assistant", content: answer, citations: [], trace: [], createdAt: new Date() } as never);
      await chatSession.save();
      return NextResponse.json({ answer, citations: [] });
    }

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      const answer = "Please select at least one document from the list on the left before asking questions.";
      chatSession.messages.push({ role: "assistant", content: answer, citations: [], trace: [], createdAt: new Date() } as never);
      await chatSession.save();
      return NextResponse.json({ answer, citations: [] });
    }

    const documentsToSearch = documentIds.filter((id: string) => sessionDocumentIds.includes(id));
    if (documentsToSearch.length === 0) {
      const answer = "The selected documents are not available in this session.";
      chatSession.messages.push({ role: "assistant", content: answer, citations: [], trace: [], createdAt: new Date() } as never);
      await chatSession.save();
      return NextResponse.json({ answer, citations: [] });
    }

    // ── Build Qdrant filter ──────────────────────────────────────────────────
    const filter = {
      should: documentsToSearch.map((docId: string) => ({
        key: "documentId",
        match: { value: docId },
      })),
    };

    // ── Agent or fallback ────────────────────────────────────────────────────
    let answer = "";
    let citations: Citation[] = [];
    let trace: any[] = [];

    const agent = await createAgent();

    if (agent) {
      console.log("🤖 AGENT FLOW — provider:", process.env.LLM_PROVIDER);
      setActiveDocumentFilter(filter);

      try {
        let result;
        try {
          result = await agent.invoke({
            messages: [{ role: "user", content: query }],
          });
        } catch (agentErr: any) {
          // Agent hit recursion limit or Groq rate limit — return graceful fallback
          console.error("⚠️ Agent error:", agentErr?.message);
          const isRecursion = agentErr?.message?.includes("recursion") || agentErr?.message?.includes("maximum");
          answer = isRecursion
            ? "I couldn't find a complete answer within the reasoning limit. Please try asking a more specific question about the documents."
            : "I encountered an issue while processing your question. Please try again.";

          chatSession.messages.push({
            role: "assistant", content: answer, citations: [], trace: [], createdAt: new Date(),
          } as never);
          await chatSession.save();
          return NextResponse.json({ answer, citations: [], trace: [] });
        }

        // Extract final answer
        const lastMessage = result.messages?.[result.messages.length - 1];
        answer = typeof lastMessage?.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage?.content ?? "");

        // Build trace
        trace = (result.messages ?? []).slice(0, -1).map((m: any, i: number) => ({
          thought: `Step ${i + 1}`,
          action: m._getType?.() === "tool" ? "tool_call" : m.role ?? m._getType?.() ?? "thinking",
          input: typeof m.content === "string"
            ? m.content.slice(0, 200)
            : JSON.stringify(m.content ?? "").slice(0, 200),
          observation: m.tool_calls
            ? JSON.stringify(m.tool_calls).slice(0, 200)
            : "",
        }));

        // Citations from what agent actually retrieved
        const citationChunks = await retrieve(query, 5, filter);
        citations = citationChunks.map((chunk) => ({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          filename: chunk.filename,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
        }));

      } finally {
        clearActiveDocumentFilter();
      }

    } else {
      // ── Fallback RAG ─────────────────────────────────────────────────────
      console.log("📦 FALLBACK RAG — provider:", process.env.LLM_PROVIDER);

      const chunks = await retrieve(query, undefined, filter);

      if (chunks.length === 0) {
        answer = "I couldn't find relevant information in the selected documents. Try rephrasing your question.";
      } else {
        const context = chunks.map((c) => c.text).join("\n\n");
        citations = chunks.map((chunk) => ({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          filename: chunk.filename,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
        }));

        const llm = createLLM();
        const response = await llm.invoke([
          {
            role: "system",
            content: "You are a helpful assistant. Answer based ONLY on the context provided. If the answer is not in the context, say so clearly.",
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${query}`,
          },
        ]);

        answer = typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      }
    }

    // ── Persist ──────────────────────────────────────────────────────────────
    chatSession.messages.push({
      role: "assistant", content: answer, citations, trace, createdAt: new Date(),
    } as never);

    if (chatSession.messages.length <= 3 && chatSession.title === "New Chat") {
      chatSession.title = query.length > 50 ? query.slice(0, 50) + "…" : query;
    }

    await chatSession.save();
    return NextResponse.json({ answer, citations, trace });

  } catch (error) {
    console.error("ASK ERROR:", error);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev && error instanceof Error ? error.message : "Something went wrong",
        details: isDev && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}