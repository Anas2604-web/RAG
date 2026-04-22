/**
 * Custom error classes for ingestion pipeline with user-friendly messages
 */

export class IngestionError extends Error {
  public readonly userMessage: string;
  public readonly suggestions: string[];
  public readonly errorCode: string;

  constructor(
    message: string,
    userMessage: string,
    suggestions: string[] = [],
    errorCode: string = "INGESTION_ERROR"
  ) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
    this.suggestions = suggestions;
    this.errorCode = errorCode;
  }
}

export class UnsupportedFormatError extends IngestionError {
  constructor(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase() || "unknown";
    super(
      `Unsupported file type: ${filename}`,
      `The file format ".${ext}" is not supported.`,
      [
        "Supported formats: PDF, DOCX, TXT, MD",
        "Try converting your file to one of these formats",
        "For PDFs, ensure the file is not corrupted or password-protected",
      ],
      "UNSUPPORTED_FORMAT"
    );
  }
}

export class EmptyFileError extends IngestionError {
  constructor(filename: string) {
    super(
      `No text extracted from ${filename}`,
      "The file appears to be empty or contains no readable text.",
      [
        "Check if the file contains actual text content",
        "For PDFs, ensure the text is not embedded as images",
        "Try using OCR software if your PDF contains scanned images",
        "For DOCX files, ensure the document is not corrupted",
      ],
      "EMPTY_FILE"
    );
  }
}

export class PDFParsingError extends IngestionError {
  constructor(originalError: string) {
    const isEncodingError = originalError.includes("URI malformed") || 
                           originalError.includes("decode");
    const isCorruptedError = originalError.includes("Invalid PDF") ||
                            originalError.includes("corrupted");
    
    let userMessage = "Failed to parse the PDF file.";
    let suggestions = ["Try re-saving the PDF using a different PDF viewer or editor"];

    if (isEncodingError) {
      userMessage = "The PDF contains text with unsupported encoding.";
      suggestions = [
        "Try re-saving the PDF with standard text encoding",
        "Use Adobe Acrobat or similar tools to 'Print to PDF' to create a clean copy",
        "Convert the PDF to DOCX format and upload that instead",
      ];
    } else if (isCorruptedError) {
      userMessage = "The PDF file appears to be corrupted or invalid.";
      suggestions = [
        "Try opening and re-saving the PDF in a PDF viewer",
        "Check if the file downloads correctly without errors",
        "Try uploading a different version of the document",
      ];
    }

    super(
      `PDF parsing failed: ${originalError}`,
      userMessage,
      suggestions,
      "PDF_PARSING_ERROR"
    );
  }
}

export class EmbeddingError extends IngestionError {
  constructor(originalError: string) {
    const isRateLimitError = originalError.includes("rate limit") ||
                            originalError.includes("429");
    const isAPIKeyError = originalError.includes("API key") ||
                         originalError.includes("401") ||
                         originalError.includes("403");
    
    let userMessage = "Failed to generate embeddings for the document.";
    let suggestions = ["Please try again in a few moments"];

    if (isRateLimitError) {
      userMessage = "The embedding service rate limit has been reached.";
      suggestions = [
        "Please wait a few minutes and try again",
        "Consider uploading smaller documents",
        "Contact support if this persists",
      ];
    } else if (isAPIKeyError) {
      userMessage = "There's an issue with the embedding service configuration.";
      suggestions = [
        "Contact your administrator",
        "The API key may be invalid or expired",
      ];
    }

    super(
      `Embedding failed: ${originalError}`,
      userMessage,
      suggestions,
      "EMBEDDING_ERROR"
    );
  }
}

export class VectorStoreError extends IngestionError {
  constructor(originalError: string) {
    const isConnectionError = originalError.includes("ECONNREFUSED") ||
                             originalError.includes("timeout") ||
                             originalError.includes("network");
    
    let userMessage = "Failed to store the document in the vector database.";
    let suggestions = ["Please try again"];

    if (isConnectionError) {
      userMessage = "Cannot connect to the vector database.";
      suggestions = [
        "The service may be temporarily unavailable",
        "Please try again in a few moments",
        "Contact support if this persists",
      ];
    }

    super(
      `Vector store error: ${originalError}`,
      userMessage,
      suggestions,
      "VECTOR_STORE_ERROR"
    );
  }
}

export class FileSizeError extends IngestionError {
  constructor(sizeBytes: number, maxSizeBytes: number) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    
    super(
      `File size ${sizeMB}MB exceeds maximum ${maxSizeMB}MB`,
      `The file is too large (${sizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
      [
        "Try splitting the document into smaller files",
        "Compress images in the PDF if applicable",
        "Remove unnecessary pages or content",
      ],
      "FILE_TOO_LARGE"
    );
  }
}

/**
 * Wraps unknown errors into IngestionError with generic message
 */
export function wrapUnknownError(error: unknown): IngestionError {
  if (error instanceof IngestionError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  
  return new IngestionError(
    message,
    "An unexpected error occurred while processing your file.",
    [
      "Please try uploading the file again",
      "If the problem persists, try a different file format",
      "Contact support if you continue to experience issues",
    ],
    "UNKNOWN_ERROR"
  );
}
