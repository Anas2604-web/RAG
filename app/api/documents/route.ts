import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";

// GET /api/documents?sessionId=xxx  — documents for a specific session
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  await connectDB();

  const chatSession = await ChatSession.findOne(
    { _id: sessionId, userId: session.user.id },
    { documents: 1 }
  );

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Map to the DocumentMetaData shape the UI expects
  const documents = chatSession.documents.map((d) => ({
    id: d.documentId,
    filename: d.filename,
    mimeType: d.mimeType,
    uploadedAt: d.uploadedAt,
    chunkCount: d.chunkCount,
    collection: d.collection,
    sizeBytes: d.sizeBytes,
  }));

  return NextResponse.json(documents);
}
