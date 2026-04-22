# Quick Start Guide - Agentic RAG System

Get the system up and running in 5 minutes.

---

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your API keys:
# - HF_API_KEY (HuggingFace)
# - QDRANT_URL (Qdrant Cloud)
# - QDRANT_API_KEY (Qdrant Cloud)
```

### 3. Run Tests
```bash
npm test
# Should see: 18 passed | 2 skipped
```

### 4. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 5. Test the System
```bash
# Upload a document
curl -X POST http://localhost:3000/api/upload \
  -F "file=@__tests__/fixtures/sample.txt"

# Query the document
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this about?"}'
```

---

## 📋 What's Working

✅ **Document Upload** - Upload TXT, MD, PDF, DOCX files
✅ **Document Processing** - Automatic parsing, chunking, embedding
✅ **Vector Search** - Retrieve relevant document chunks
✅ **LLM Integration** - Generate answers from documents
✅ **Source Attribution** - Know where answers come from

---

## 🧪 Run Tests

```bash
# All tests
npm test

# Specific test suite
npm test -- env.test.ts
npm test -- parser.test.ts
npm test -- splitter.property.test.ts
npm test -- pretty-printer.property.test.ts
```

---

## 🚀 API Endpoints

### Upload Document
```bash
POST /api/upload
Content-Type: multipart/form-data

file: <binary file data>
```

**Response**:
```json
{
  "message": "File uploaded and processed successfully 🚀",
  "filename": "document.txt"
}
```

### Query Documents
```bash
POST /api/ask
Content-Type: application/json

{
  "query": "What is this about?"
}
```

**Response**:
```json
{
  "answer": "The document discusses...",
  "sources": [
    {
      "filename": "document.txt",
      "chunkIndex": 0,
      "text": "..."
    }
  ]
}
```

---

## 📁 Project Structure

```
lib/
├── agents/          ✅ Agent & tools
├── config/          ✅ Environment config
├── docstore/        ✅ Document storage
├── embeddings/      ✅ Embedding service
├── ingestion/       ✅ File parsing & chunking
├── llm/             ✅ LLM factory
├── logger/          ✅ Logging
└── vectorstore/     ✅ Qdrant integration

app/api/
├── ask/             ✅ Query endpoint
└── upload/          ✅ Upload endpoint

__tests__/
├── unit/            ✅ Unit tests
├── property/        ✅ Property tests
└── fixtures/        ✅ Test files
```

---

## 🔧 Configuration

Edit `.env` to customize:

```bash
# LLM Provider (openai, together, ollama)
LLM_PROVIDER=openai

# Embedding Model (huggingface, ollama)
EMBEDDING_MODEL=huggingface

# Qdrant Configuration
QDRANT_URL=https://your-qdrant-cloud-url
QDRANT_API_KEY=your-api-key

# Chunking Configuration
CHUNK_SIZE=512
CHUNK_OVERLAP=64

# Logging
LOG_LEVEL=info
```

---

## 📊 System Status

| Component | Status |
|-----------|--------|
| Document Upload | ✅ Working |
| File Parsing | ✅ Working |
| Text Chunking | ✅ Working |
| Embeddings | ✅ Working |
| Vector Search | ✅ Working |
| LLM Integration | ✅ Working |
| Query Processing | ✅ Working |
| Source Attribution | ✅ Working |
| Logging | ✅ Working |
| Tests | ✅ 18 Passing |

---

## 🐛 Troubleshooting

### Tests Failing
```bash
# Check environment
npm test -- env.test.ts

# Check dependencies
npm install

# Clear cache
rm -rf node_modules/.vite
npm test
```

### API Not Responding
```bash
# Check server is running
npm run dev

# Check port 3000 is available
lsof -i :3000

# Check environment variables
cat .env
```

### Upload Failing
```bash
# Check file format is supported (txt, md, pdf, docx)
# Check file size is reasonable
# Check Qdrant connection
```

### Query Not Working
```bash
# Check documents are uploaded
# Check Qdrant has data
# Check LLM API key is valid
# Check embedding model is configured
```

---

## 📚 Documentation

- `docs/IMPLEMENTATION_STATUS.md` - Detailed implementation status
- `docs/TESTING_GUIDE.md` - Comprehensive testing guide
- `docs/WHATS_WORKING.md` - What's implemented and working
- `docs/LEARNING_PATH.txt` - Learning resources
- `docs/tasks.md` - Full task list

---

## 🎯 Next Steps

1. **Upload Documents** - Test with sample files
2. **Query Documents** - Ask questions about uploaded content
3. **Build UI** - Create chat and document management interfaces
4. **Deploy** - Deploy to production

---

## 💡 Tips

- Use `LOG_LEVEL=debug` for detailed logging
- Test with small files first
- Check `data/documents.json` to see stored metadata
- Use curl or Postman to test APIs
- Run tests frequently to catch issues early

---

## 📞 Need Help?

1. Check `docs/TESTING_GUIDE.md` for testing procedures
2. Review error messages in console
3. Check `.env` configuration
4. Run `npm test` to verify setup
5. Check `data/documents.json` for stored documents

---

## ✨ Features

- 📄 **Multi-format Support** - TXT, MD, PDF, DOCX
- 🔍 **Vector Search** - Fast semantic search
- 🤖 **LLM Integration** - Multiple LLM providers
- 📊 **Source Attribution** - Know where answers come from
- 🧪 **Comprehensive Tests** - 18 automated tests
- 📝 **Structured Logging** - JSON-based logging
- 🔒 **Type-Safe** - Full TypeScript support

---

## 🚀 Ready to Go!

Your Agentic RAG system is ready to use. Start uploading documents and asking questions!

```bash
npm run dev
```

Then visit `http://localhost:3000` to get started.

