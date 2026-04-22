# Testing Guide - Agentic RAG System

This guide shows how to test all implemented components of the Agentic RAG system.

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your API keys in .env
```

### Run All Tests
```bash
npm test
# Output: 18 passed | 2 skipped
```

---

## 🧪 Testing by Section

### Section 1-7: Core Infrastructure (Automated Tests)

#### 1. Environment Configuration
```bash
npm test -- env.test.ts
```
**Tests**:
- Missing required variables
- Default values for optional variables
- Type coercion
- Conditional required logic

#### 2. File Parsing
```bash
npm test -- parser.test.ts
```
**Tests**:
- TXT file parsing
- MD file parsing
- Unsupported file format error
- UTF-8 encoding preservation
- Empty file handling

#### 3. Text Splitting
```bash
npm test -- splitter.property.test.ts
```
**Tests** (Property-based, 100+ iterations):
- Chunk size invariant (all chunks ≤ chunkSize)
- Chunk count validation
- Empty text handling

#### 4. Logger & Pretty Printer
```bash
npm test -- pretty-printer.property.test.ts
```
**Tests** (Property-based, 100+ iterations):
- Trace formatting
- Human-readable output
- Contains required fields (Thought, Action, Observation)

---

### Section 8-10: Backend Services (Manual Testing)

#### 1. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

#### 2. Test Upload API

**Upload a text file:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@__tests__/fixtures/sample.txt"
```

**Expected Response:**
```json
{
  "message": "File uploaded and processed successfully 🚀",
  "filename": "sample.txt"
}
```

**Upload a markdown file:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@__tests__/fixtures/sample.md"
```

**Test error handling (no file):**
```bash
curl -X POST http://localhost:3000/api/upload
```

**Expected Response:**
```json
{
  "error": "File is required"
}
```

#### 3. Test Ask API

**Query the uploaded documents:**
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?"}'
```

**Expected Response:**
```json
{
  "answer": "The document contains information about...",
  "sources": [
    {
      "filename": "sample.txt",
      "chunkIndex": 0,
      "text": "..."
    }
  ]
}
```

**Test with different queries:**
```bash
# Query 1
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about the content"}'

# Query 2
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the main topics?"}'
```

**Test error handling (no query):**
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "error": "Query is required"
}
```

---

## 📊 Full Integration Test Workflow

### Step 1: Start the Server
```bash
npm run dev
```

### Step 2: Upload Multiple Documents
```bash
# Upload sample text file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@__tests__/fixtures/sample.txt"

# Upload sample markdown file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@__tests__/fixtures/sample.md"
```

### Step 3: Query the Documents
```bash
# Query 1: General question
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main topic?"}'

# Query 2: Specific question
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me about the sections"}'

# Query 3: Another question
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What information is provided?"}'
```

### Step 4: Verify Results
- Check that answers are generated from the uploaded documents
- Verify that sources are correctly attributed
- Confirm that context is properly retrieved

---

## 🔍 Component-Level Testing

### Test Document Store
```bash
node -e "
const { docStore } = require('./lib/docstore/doc-store');

(async () => {
  // Save a document
  const doc = {
    id: 'test-1',
    filename: 'test.txt',
    mimeType: 'text/plain',
    uploadedAt: new Date().toISOString(),
    chunkCount: 5,
    collection: 'default',
    sizeBytes: 1024
  };
  
  await docStore.saveDocument(doc);
  console.log('✓ Document saved');
  
  // Retrieve the document
  const retrieved = await docStore.getDocument('test-1');
  console.log('✓ Document retrieved:', retrieved);
  
  // List all documents
  const all = await docStore.listDocuments();
  console.log('✓ All documents:', all.length);
  
  // Delete the document
  await docStore.deleteDocument('test-1');
  console.log('✓ Document deleted');
})();
"
```

### Test Logger
```bash
node -e "
const { logger } = require('./lib/logger/logger');

logger.info({ event: 'test_info', message: 'This is an info log' });
logger.debug({ event: 'test_debug', data: 'Debug information' });
logger.error({ event: 'test_error', error: 'An error occurred' });

console.log('✓ Logger test complete');
"
```

### Test LLM Factory
```bash
node -e "
const { createLLM } = require('./lib/llm/llm-factory');

try {
  const llm = createLLM();
  console.log('✓ LLM created:', llm.constructor.name);
  console.log('✓ LLM provider:', process.env.LLM_PROVIDER);
} catch (error) {
  console.error('✗ LLM creation failed:', error.message);
}
"
```

### Test Retriever Tool
```bash
node -e "
const { retrieverTool } = require('./lib/agents/tools');

(async () => {
  try {
    const result = await retrieverTool.invoke({ query: 'test query' });
    console.log('✓ Retriever tool result:', result);
  } catch (error) {
    console.error('✗ Retriever tool error:', error.message);
  }
})();
"
```

---

## 📈 Performance Testing

### Test Ingestion Performance
```bash
node -e "
const { ingest } = require('./lib/ingestion/pipeline');
const fs = require('fs');

(async () => {
  const startTime = Date.now();
  
  // Create a test file with 10KB of text
  const text = 'Lorem ipsum dolor sit amet. '.repeat(400);
  const buffer = Buffer.from(text);
  
  try {
    const result = await ingest(buffer, 'perf-test.txt', 'text/plain');
    const duration = Date.now() - startTime;
    
    console.log('✓ Ingestion completed in', duration, 'ms');
    console.log('✓ Chunks created:', result.chunkCount);
    console.log('✓ File size:', result.sizeBytes, 'bytes');
  } catch (error) {
    console.error('✗ Ingestion failed:', error.message);
  }
})();
"
```

### Test Query Performance
```bash
node -e "
const { retrieve } = require('./lib/vectorstore/retriever');

(async () => {
  const startTime = Date.now();
  
  try {
    const results = await retrieve('test query', 5);
    const duration = Date.now() - startTime;
    
    console.log('✓ Retrieval completed in', duration, 'ms');
    console.log('✓ Results found:', results.length);
  } catch (error) {
    console.error('✗ Retrieval failed:', error.message);
  }
})();
"
```

---

## 🐛 Debugging

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm run dev
```

### Check Environment Variables
```bash
node -e "
const { config } = require('./lib/config/env');
console.log('Configuration:');
console.log('- LLM Provider:', config.LLM_PROVIDER);
console.log('- Qdrant URL:', config.QDRANT_URL);
console.log('- Embedding Model:', config.EMBEDDING_MODEL);
console.log('- Chunk Size:', config.CHUNK_SIZE);
console.log('- Chunk Overlap:', config.CHUNK_OVERLAP);
"
```

### Check Document Store
```bash
node -e "
const fs = require('fs');
const path = require('path');

const docPath = path.join(process.cwd(), 'data', 'documents.json');
if (fs.existsSync(docPath)) {
  const docs = JSON.parse(fs.readFileSync(docPath, 'utf-8'));
  console.log('Documents in store:', docs.length);
  docs.forEach(doc => {
    console.log('- ', doc.filename, '(', doc.chunkCount, 'chunks)');
  });
} else {
  console.log('No documents stored yet');
}
"
```

---

## ✅ Test Checklist

- [ ] Run `npm test` - all tests pass
- [ ] Start dev server - `npm run dev`
- [ ] Upload a text file - verify success response
- [ ] Upload a markdown file - verify success response
- [ ] Query uploaded documents - verify answer and sources
- [ ] Test error handling - missing file, missing query
- [ ] Check document store - documents are saved
- [ ] Check logs - structured JSON output
- [ ] Test with different queries - verify context retrieval
- [ ] Verify LLM integration - answers are generated

---

## 📝 Notes

- All API endpoints are available at `http://localhost:3000/api/*`
- Test fixtures are in `__tests__/fixtures/`
- Document store is in `data/documents.json`
- Logs are output to console in JSON format
- Environment variables must be set in `.env` file

---

## 🔗 Related Files

- `docs/IMPLEMENTATION_STATUS.md` - Implementation status
- `docs/tasks.md` - Full task list
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template
- `vitest.config.ts` - Test configuration

