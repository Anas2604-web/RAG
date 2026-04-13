import mammoth from "mammoth";
import { logger } from "@/lib/logger/logger";

export class UnsupportedFormatError extends Error {
  constructor(filename: string) {
    super(`Unsupported file type: ${filename}. Supported: txt, md, docx`);
    this.name = "UnsupportedFormatError";
  }
}

export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  try {
    let text: string;

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === "txt" || ext === "md") {
      text = buffer.toString("utf-8");
    } else {
      throw new UnsupportedFormatError(filename);
    }

    logger.debug({
      event: "parser.success",
      filename,
      format: ext,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    logger.error({
      event: "parser.error",
      filename,
      format: ext,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}