# Step-by-Step Development Guide: Agentic RAG

This guide is fully self-contained. Follow each step in order and you will have a running Agentic RAG system without needing any AI assistance.

---

## Section 1: Prerequisites

Before you start, make sure you have the following installed and ready.

**Software:**
- Node.js 20 or later — https://nodejs.org (check with `node --version`)
- npm 10 or later (comes with Node.js — check with `npm --version`)
- Docker Desktop — https://www.docker.com/products/docker-desktop (needed to run Qdrant locally)
- Git — https://git-scm.com

**Accounts (free tiers are sufficient):**
- Together AI — https://api.together.xyz (for the default LLM, Mistral-7B)
- Hugging Face — https://huggingface.co (for the default embedding model)

**Optional (for fully local setup without cloud APIs):**
- Ollama — https://ollama.com (runs LLM and embedding model locally)

---

## Section 2: Clone and Install

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-folder>

# 2. Install all dependencies
npm install

# 3. Verify the install succeeded
npm run build
# Expected: "✓ Compiled successfully" (or similar). No errors.
```

---

## Section 3: Environment Setup

The system reads all configuration from environment variables. You must create a `.env.local` file before running the app.

```bash
# Copy the example file
cp .env.example .env.local
```

Now open `.env.local` in your editor and fill in the values. Here is what each variable means and where to find it:

### Required variables

**`QDRANT_URL`**
The URL of your Qdrant instance.
- If running locally with Docker (Section 4): `http://localhost:6333`
- If using Qdrant Cloud: copy the cluster URL from https://cloud.qdrant.io → your cluster → "Dashboard"

**`TOGETHER_API_KEY`** (required when `LLM_PROVIDER=together`, which is the default)
1. Go to https://api.together.xyz
2. Sign in or create a free account
3. Click your avatar → "API Keys"
4. Click "Create API Key", copy the value

**`HF_API_KEY`** (required when `EMBEDDING_PROVIDER=huggingface`, which is the default)
1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Select "Read" role, give it a name, click "Generate"
4. Copy the token value (starts with `hf_`)

### Optional variables (defaults shown)

```
LLM_PROVIDER=together
LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
EMBEDDING_PROVIDER=huggingface
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
QDRANT_COLLECTION=documents
CHUNK_SIZE=512
CHUNK_OVERLAP=64
RETRIEVER_K=5
AGENT_MAX_STEPS=10
LOG_LEVEL=info
```

You do not need to set these unless you want to change the defaults.

### Example `.env.local` for the default setup

```
QDRANT_URL=http://localhost:6333
TOGETHER_API_KEY=your-together-api-key-here
HF_API_KEY=hf_your-huggingface-token-here
```

---

## Section 4: Start Qdrant Locally

Qdrant is the vector database that stores your document embeddings. Run it with Docker:

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

**What this does:**
- `-d`: runs in the background
- `-p 6333:6333`: exposes Qdrant on port 6333
- `-v $(pwd)/qdrant_storage:/qdrant/storage`: persists data to a local folder so it survives container restarts

**Verify Qdrant is running:**
```bash
curl http://localhost:6333/healthz
# Expected response: {"title":"qdrant - vector search engine","version":"..."}
```

**To stop Qdrant:**
```bash
docker stop qdrant
```

**To restart it later:**
```bash
docker start qdrant
```

---

## Section 5: Run the Dev Server

```bash
npm run dev
```

Expected terminal output:
```
  ▲ Next.js 16.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in Xs
```

Open http://localhost:3000 in your browser. You should see the Agentic RAG interface with a document panel on the left and a chat window on the right.

**If you see an error about a missing environment variable**, check that your `.env.local` file exists and contains the required variables from Section 3.

---

## Section 6: Upload Your First Document

1. In the browser, find the **Document Panel** on the left side of the page.
2. Either drag a PDF, TXT, MD, or DOCX file onto the drop zone, or click the drop zone to open a file picker.
3. Select a file. The upload progress percentage will appear.
4. When the upload completes, the document appears in the list below the drop zone, showing its filename, upload time, and chunk count.

**Supported file types:** `.pdf`, `.txt`, `.md`, `.docx`

**If the upload fails**, the error message from the server will appear below the drop zone. Common causes:
- Unsupported file type → use one of the four supported types
- Embedding service unavailable → check your `HF_API_KEY` in `.env.local`
- Qdrant unreachable → make sure Docker is running (Section 4)

---

## Section 7: Ask Your First Question

1. Click the text input at the bottom of the **Chat Window** on the right.
2. Type a question about the document you uploaded. For example: *"What is the main topic of this document?"*
3. Press **Enter** or click the send button.
4. The answer streams in token by token. When it finishes, citations appear below the answer showing which document chunks were used.
5. Click any citation to expand it and see the exact text that was retrieved.

**To copy an answer**, click the copy button on any assistant message.

**To start a fresh conversation**, click the **New Session** button. This clears the message history and resets the agent's memory.

---

## Section 8: Run Tests

```bash
npm test
```

This runs all unit and property-based tests once (no watch mode). Expected output:
```
 ✓ __tests__/unit/parser.test.ts
 ✓ __tests__/unit/splitter.test.ts
 ✓ __tests__/property/splitter.property.test.ts
 ...
 Test Files  X passed
 Tests       Y passed
 Duration    Zs
```

Each property-based test runs a minimum of 100 randomly generated inputs. If a test fails, `fast-check` will print the exact failing input so you can reproduce it.

**To run a single test file:**
```bash
npx vitest run __tests__/property/agent.property.test.ts
```

**To run tests in watch mode during development:**
```bash
npm run test:watch
```

---

## Section 9: Switching LLM Providers

### Switch to Hugging Face Inference API

```
LLM_PROVIDER=huggingface
LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
HF_API_KEY=hf_your-token-here
```

### Switch to Ollama (fully local, no cloud API needed)

1. Install Ollama from https://ollama.com
2. Pull the model:
   ```bash
   ollama pull mistral
   ```
3. Set in `.env.local`:
   ```
   LLM_PROVIDER=ollama
   LLM_MODEL=mistral
   OLLAMA_BASE_URL=http://localhost:11434
   ```

No code changes are needed — only the environment variables change.

---

## Section 10: Switching Embedding Models

### Switch to Ollama embeddings (fully local)

1. Pull the embedding model:
   ```bash
   ollama pull bge-small-en
   ```
2. Set in `.env.local`:
   ```
   EMBEDDING_PROVIDER=ollama
   EMBEDDING_MODEL=bge-small-en
   OLLAMA_BASE_URL=http://localhost:11434
   ```

### Important: Dimension mismatch warning

If you switch embedding models after already ingesting documents, the new model may produce vectors of a different dimension than the existing Qdrant collection. If this happens, the ingestion pipeline will return an error like:

```
Embedding dimension mismatch: model produces 768-dim but collection expects 384-dim
```

**To fix this**, you have two options:
1. Delete the existing collection in Qdrant and re-ingest all documents with the new model.
2. Use a different collection name (`QDRANT_COLLECTION=documents-v2`) for the new model.

---

## Section 11: Troubleshooting

### "Missing required environment variable: QDRANT_URL"
Your `.env.local` file is missing or does not contain `QDRANT_URL`. Check that the file exists in the project root and contains the variable.

### "Vector store unavailable" / connection refused on port 6333
Qdrant is not running. Start it with:
```bash
docker start qdrant
# or if you haven't created the container yet:
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### "Embedding service unavailable"
The Hugging Face Inference API is unreachable or your `HF_API_KEY` is invalid. Check:
1. `HF_API_KEY` is set correctly in `.env.local`
2. The HF Inference API is not rate-limiting you (free tier has limits)
3. Alternatively, switch to Ollama embeddings (Section 10)

### "Unsupported file type: .xyz"
Only `.pdf`, `.txt`, `.md`, and `.docx` files are supported. Convert your file to one of these formats.

### "Embedding dimension mismatch"
See Section 10 for the fix.

### The chat response says "reasoning was incomplete — maximum steps reached"
The agent hit the 10-step limit. This usually means the query is very complex or the retriever is not finding relevant chunks. Try:
1. Rephrasing your question to be more specific
2. Increasing `AGENT_MAX_STEPS` in `.env.local` (e.g., `AGENT_MAX_STEPS=15`)
3. Checking that the relevant document was successfully ingested (visible in the document list)

### TypeScript errors on `npm run build`
Run `npm run lint` to see detailed errors. Most common cause is a missing type import from `types/index.ts`. Add the missing import and rebuild.

### Tests fail with "Cannot find module"
Run `npm install` to make sure all dependencies are installed, then retry.
