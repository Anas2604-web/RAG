import { NextRequest, NextResponse } from "next/server";
import { ingest } from "@/lib/ingestion/pipeline";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await ingest(buffer, file.name, file.type);

    return NextResponse.json({
      message: "File uploaded and processed successfully 🚀",
      filename: file.name,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}