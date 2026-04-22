import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ingest } from "@/lib/ingestion/pipeline";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await ingest(buffer, file.name, file.type);

    // Attach document metadata to the chat session if provided
    if (sessionId) {
      await connectDB();
      await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId: session.user.id },
        {
          $push: {
            documents: {
              documentId: meta.id,
              filename: meta.filename,
              mimeType: meta.mimeType,
              uploadedAt: new Date(meta.uploadedAt),
              chunkCount: meta.chunkCount,
              collection: meta.collection,
              sizeBytes: meta.sizeBytes,
            },
          },
        }
      );
    }

    return NextResponse.json({
      message: "File uploaded and processed successfully",
      filename: file.name,
      documentId: meta.id,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
