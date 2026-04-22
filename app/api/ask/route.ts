import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { retrieve } from "@/lib/vectorstore/retriever";
import { createLLM } from "@/lib/llm/llm-factory";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";
import type { Citation } from "@/types/index";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { query, sessionId, documentIds } = body;

    console.log("API /ask received:", { 
      query: query?.substring(0, 50), 
      sessionId, 
      documentIds,
      documentIdsType: typeof documentIds,
      documentIdsIsArray: Array.isArray(documentIds),
      documentIdsLength: documentIds?.length 
    });

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await connectDB();

    // Verify session belongs to user
    const chatSession = await ChatSession.findOne({
      _id: sessionId,
      userId: session.user.id,
    });
    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Persist the user message immediately
    chatSession.messages.push({
      role: "user",
      content: query,
      citations: [],
      trace: [],
      createdAt: new Date(),
    } as never);
    await chatSession.save();

    const llm = createLLM();

    // Get all document IDs from this session
    const sessionDocumentIds = chatSession.documents.map((doc) => doc.documentId);

    // If no documents in session, return early
    if (sessionDocumentIds.length === 0) {
      const answer = "Please upload documents to this session before asking questions. I can only answer based on documents you've uploaded.";
      
      chatSession.messages.push({
        role: "assistant",
        content: answer,
        citations: [],
        trace: [],
        createdAt: new Date(),
      } as never);
      await chatSession.save();

      return NextResponse.json({ answer, citations: [] });
    }

    // REQUIRE explicit document selection
    // If no documents are selected, prompt user to select
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      const answer = "Please select at least one document from the list on the left before asking questions. I can only answer based on the documents you explicitly select.";
      
      chatSession.messages.push({
        role: "assistant",
        content: answer,
        citations: [],
        trace: [],
        createdAt: new Date(),
      } as never);
      await chatSession.save();

      return NextResponse.json({ answer, citations: [] });
    }

    // Verify selected documents belong to this session
    const documentsToSearch = documentIds.filter((id: string) => 
      sessionDocumentIds.includes(id)
    );
    
    // If user selected documents that don't belong to this session, return error
    if (documentsToSearch.length === 0) {
      const answer = "The selected documents are not available in this session. Please select documents from the list on the left.";
      
      chatSession.messages.push({
        role: "assistant",
        content: answer,
        citations: [],
        trace: [],
        createdAt: new Date(),
      } as never);
      await chatSession.save();

      return NextResponse.json({ answer, citations: [] });
    }

    // Build Qdrant filter for the documents to search
    // Qdrant filter format: https://qdrant.tech/documentation/concepts/filtering/
    const filter: any = {
      should: documentsToSearch.map((docId: string) => ({
        key: "documentId",
        match: { value: docId },
      })),
    };

    const chunks = await retrieve(query, undefined, filter);

    if (chunks.length === 0) {
      const answer =
        documentIds?.length > 0
          ? "I couldn't find any relevant information in the selected documents. Try selecting different documents or rephrasing your question."
          : "I couldn't find any relevant information in your uploaded documents for this session. Try rephrasing your question or upload additional documents.";

      chatSession.messages.push({
        role: "assistant",
        content: answer,
        citations: [],
        trace: [],
        createdAt: new Date(),
      } as never);
      await chatSession.save();

      return NextResponse.json({ answer, citations: [] });
    }

    const context = chunks.map((c) => c.text).join("\n\n");

    const citations: Citation[] = chunks.map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      filename: chunk.filename,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
    }));

    const response = await llm.invoke([
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based ONLY on the provided context.

CRITICAL RULES:
- You MUST ONLY use information from the provided context to answer
- If the context does not contain enough information, respond with: "I cannot answer this question based on the provided documents."
- Do NOT use your general knowledge or make assumptions
- Do NOT make up information

Response format:
- Use simple, clear language
- Do NOT use Markdown (no *, **, #, bullets)
- Write in clean plain text with short paragraphs`,
      },
      {
        role: "user",
        content: `Context from documents:\n${context}\n\nQuestion: ${query}`,
      },
    ]);

    const answer =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Persist assistant message
    chatSession.messages.push({
      role: "assistant",
      content: answer,
      citations,
      trace: [],
      createdAt: new Date(),
    } as never);

    // Auto-title the session from the first user message
    if (chatSession.messages.length <= 3 && chatSession.title === "New Chat") {
      chatSession.title =
        query.length > 50 ? query.slice(0, 50) + "…" : query;
    }

    await chatSession.save();

    return NextResponse.json({ answer, citations });
  } catch (error) {
    console.error("ASK ERROR:", error);
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    const isDevelopment = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        error: isDevelopment ? errorMessage : "Something went wrong",
        details: isDevelopment && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
