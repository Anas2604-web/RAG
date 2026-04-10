import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { logger } from "@/lib/logger/logger";

export async function splitText(
  text: string,
  chunkSize: number = 512,
  overlap: number = 64
): Promise<string[]> {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap: overlap,
    });

    const chunks = await splitter.splitText(text);

    logger.debug({
      event: "splitter.success",
      textLength: text.length,
      chunkCount: chunks.length,
      chunkSize,
      overlap,
    });

    return chunks;
  } catch (error) {
    logger.error(
      {
        event: "splitter.error",
        textLength: text.length,
        chunkSize,
        overlap,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to split text"
    );

    throw new Error(
      `Failed to split text: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
