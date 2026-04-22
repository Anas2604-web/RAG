# Error Handling Improvements

## Overview

Comprehensive error handling has been implemented throughout the document upload and ingestion pipeline to provide users with clear, actionable feedback when issues occur.

## Changes Made

### 1. Custom Error Classes (`lib/ingestion/errors.ts`)

Created specialized error classes that provide:
- **User-friendly messages**: Clear explanations of what went wrong
- **Actionable suggestions**: Specific steps users can take to resolve the issue
- **Error codes**: For tracking and debugging purposes

#### Error Types:

- **UnsupportedFormatError**: File format not supported
- **EmptyFileError**: File contains no readable text
- **PDFParsingError**: Issues parsing PDF files (encoding, corruption, etc.)
- **EmbeddingError**: Problems with the embedding service (rate limits, API keys)
- **VectorStoreError**: Database connection or storage issues
- **FileSizeError**: File exceeds maximum size limit

### 2. Parser Improvements (`lib/ingestion/parser.ts`)

- Added try-catch around `decodeURIComponent` to handle PDFs with malformed URI encoding
- Falls back to raw text when decoding fails instead of crashing
- Throws `PDFParsingError` with context-specific suggestions

### 3. Pipeline Error Handling (`lib/ingestion/pipeline.ts`)

- Wraps embedding operations in try-catch to detect API issues
- Wraps vector store operations to detect connection problems
- Uses `wrapUnknownError` to ensure all errors have user-friendly messages
- Maintains detailed logging for debugging

### 4. Upload API Route (`app/api/upload/route.ts`)

- Added 10MB file size limit with validation
- Returns structured error responses with:
  - `error`: User-friendly error message
  - `suggestions`: Array of actionable suggestions
  - `errorCode`: Error identifier for tracking
- Handles `IngestionError` instances specially to preserve detailed feedback

### 5. Client-Side Validation (`components/documents/DropZone.tsx`)

Early validation before upload:
- File type checking (PDF, DOCX, TXT, MD only)
- File size validation (10MB max)
- Empty file detection
- Immediate feedback without server round-trip

### 6. Enhanced Error Display (`components/documents/DocumentPanel.tsx`)

Rich error UI showing:
- Error icon for visual clarity
- Main error message in prominent text
- Bulleted list of suggestions
- Error code for reference
- Proper styling with red theme for errors

## Example Error Messages

### Unsupported Format
```
The file format ".xlsx" is not supported.

Suggestions:
• Supported formats: PDF, DOCX, TXT, MD
• Try converting your file to one of these formats
• For PDFs, ensure the file is not corrupted or password-protected
```

### PDF Encoding Error
```
The PDF contains text with unsupported encoding.

Suggestions:
• Try re-saving the PDF with standard text encoding
• Use Adobe Acrobat or similar tools to 'Print to PDF' to create a clean copy
• Convert the PDF to DOCX format and upload that instead
```

### File Too Large
```
The file is too large (15.32MB). Maximum size is 10.00MB.

Suggestions:
• Try splitting the document into smaller files
• Compress images in the PDF if applicable
• Remove unnecessary pages or content
```

### Empty File
```
The file appears to be empty or contains no readable text.

Suggestions:
• Check if the file contains actual text content
• For PDFs, ensure the text is not embedded as images
• Try using OCR software if your PDF contains scanned images
• For DOCX files, ensure the document is not corrupted
```

### Rate Limit Error
```
The embedding service rate limit has been reached.

Suggestions:
• Please wait a few minutes and try again
• Consider uploading smaller documents
• Contact support if this persists
```

## Benefits

1. **Better User Experience**: Users understand what went wrong and how to fix it
2. **Reduced Support Burden**: Clear suggestions help users self-resolve issues
3. **Easier Debugging**: Error codes and detailed logging help developers diagnose problems
4. **Graceful Degradation**: System handles edge cases without crashing
5. **Early Validation**: Client-side checks prevent unnecessary server requests

## Testing

To test the error handling:

1. **Unsupported format**: Try uploading a .xlsx or .jpg file
2. **File too large**: Try uploading a file > 10MB
3. **Empty file**: Create an empty .txt file and upload
4. **PDF encoding**: Upload a PDF with special characters (already fixed)
5. **Network error**: Disconnect network during upload

## Future Improvements

- Add retry logic for transient errors
- Implement exponential backoff for rate limits
- Add telemetry to track error frequencies
- Create admin dashboard for error monitoring
- Add support for larger files with chunked uploads
