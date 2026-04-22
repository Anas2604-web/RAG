import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { qdrantClient } from "@/lib/vectorstore/qdrant-client";
import { config } from "@/lib/config/env";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    await connectDB();

    // Remove document from the session's document list
    if (sessionId) {
      await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId: session.user.id },
        { $pull: { documents: { documentId } } }
      );
    }

    // Delete vectors from Qdrant
    const collection = config.QDRANT_COLLECTION;
    try {
      let offset: string | null = null;
      const pointsToDelete: (string | number)[] = [];

      do {
        const scrollResult = await qdrantClient.scroll(collection, {
          limit: 100,
          offset: offset || undefined,
          with_payload: true,
        });

        for (const point of scrollResult.points ?? []) {
          if (point.payload?.documentId === documentId) {
            pointsToDelete.push(point.id);
          }
        }

        offset = scrollResult.next_page_offset || null;
      } while (offset);

      if (pointsToDelete.length > 0) {
        await qdrantClient.delete(collection, { points: pointsToDelete });
      }
    } catch (err) {
      console.error("Qdrant delete error:", err);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE DOCUMENT ERROR:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
