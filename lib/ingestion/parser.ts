import mammoth from "mammoth";
import PDFParser from "pdf2json";
import { logger } from "@/lib/logger/logger";
import { UnsupportedFormatError, PDFParsingError } from "./errors";

async function parsePDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const rawText = (pdfParser as any).getRawTextContent();
        
        // Log what we got
        logger.debug({
          event: "pdf.parse",
          rawTextLength: rawText?.length || 0,
          rawTextPreview: rawText?.substring(0, 200) || "",
        });
        
        // If getRawTextContent returns empty, try getting text from pages
        if (!rawText || rawText.trim().length === 0) {
          const pdfData = (pdfParser as any).data;
          if (pdfData && pdfData.Pages) {
            const texts: string[] = [];
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const text of page.Texts) {
                  if (text.R) {
                    for (const run of text.R) {
                      if (run.T) {
                        try {
                          texts.push(decodeURIComponent(run.T));
                        } catch (e) {
                          // If decoding fails, use the raw text
                          texts.push(run.T);
                        }
                      }
                    }
                  }
                }
              }
            }
            const extractedText = texts.join(" ");
            logger.debug({
              event: "pdf.parse.fallback",
              extractedTextLength: extractedText.length,
            });
            resolve(extractedText);
          } else {
            resolve(rawText || "");
          }
        } else {
          resolve(rawText);
        }
      } catch (error) {
        logger.error({
          event: "pdf.parse.error",
          error: error instanceof Error ? error.message : String(error),
        });
        throw new PDFParsingError(
          error instanceof Error ? error.message : String(error)
        );
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  try {
    let text: string;

    if (ext === "pdf") {
      text = await parsePDF(buffer);
    } else if (ext === "docx") {
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