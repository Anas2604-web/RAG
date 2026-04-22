import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongoose";
import ChatSession from "@/lib/db/models/ChatSession";

// GET /api/sessions — list all sessions for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const sessions = await ChatSession.find(
    { userId: session.user.id },
    { title: 1, createdAt: 1, updatedAt: 1, "messages": { $slice: -1 } }
  ).sort({ updatedAt: -1 });

  return NextResponse.json(sessions);
}

// POST /api/sessions — create a new session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const body = await req.json().catch(() => ({}));
  const title = body.title?.trim() || "New Chat";

  const newSession = await ChatSession.create({
    userId: session.user.id,
    title,
  });

  return NextResponse.json(newSession, { status: 201 });
}
