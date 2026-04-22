import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ingest } from "@/lib/ingestion/pipeline";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";
import { IngestionError, FileSizeError } from "@/lib/ingestion/errors";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const error = new FileSizeError(file.size, MAX_FILE_SIZE);
      return NextResponse.json(
        {
          error: error.userMessage,
          suggestions: error.suggestions,
          errorCode: error.errorCode,
        },
        { status: 400 }
      );
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

    // Handle IngestionError with detailed user feedback
    if (error instanceof IngestionError) {
      return NextResponse.json(
        {
          error: error.userMessage,
          suggestions: error.suggestions,
          errorCode: error.errorCode,
        },
        { status: 400 }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your file.",
        suggestions: [
          "Please try uploading the file again",
          "If the problem persists, try a different file format",
          "Contact support if you continue to experience issues",
        ],
        errorCode: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
