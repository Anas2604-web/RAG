# AgenticRAG

An agentic Retrieval-Augmented Generation (RAG) system built on **Next.js 16**, using **LangChain**, open-source LLMs, and **Qdrant** as the vector database.

Upload documents, ask questions, and get grounded answers with citations — powered entirely by open-source models.

---

## What it does

- **Document ingestion** — Upload PDF, DOCX, TXT, or Markdown files. They're parsed, chunked, embedded, and stored in Qdrant.
- **Agentic reasoning** — A LangChain ReAct agent reasons across multiple retrieval steps, rewrites queries when needed, and synthesizes answers from multiple document sections.
- **Streaming chat UI** — Responses stream token-by-token via SSE. Citations are expandable inline.
- **Open-source stack** — No proprietary model lock-in. Swap LLM providers or embedding models via environment variables.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Agent orchestration | LangChain.js |
| LLM (default) | Mistral-7B-Instruct via Together AI |
| Vector database | Qdrant (self-hosted or cloud) |
| Embedding model | BAAI/bge-small-en-v1.5 via Hugging Face |
| Streaming | Server-Sent Events (SSE) |
| Logging | pino (structured JSON) |

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` — at minimum you need:

```
QDRANT_URL=http://localhost:6333
TOGETHER_API_KEY=your-together-api-key
HF_API_KEY=hf_your-huggingface-token
```

### 3. Start Qdrant

```bash
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Switching providers

All provider config is environment-variable driven — no code changes needed.

**Use Ollama (fully local):**
```
LLM_PROVIDER=ollama
LLM_MODEL=mistral
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=bge-small-en
OLLAMA_BASE_URL=http://localhost:11434
```

**Use Hugging Face for LLM:**
```
LLM_PROVIDER=huggingface
LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2
HF_API_KEY=hf_...
```

---

## Documentation

- [Architecture](docs/architecture.md) — system design, component diagrams, data models
- [Dev Guide](docs/dev-guide.md) — step-by-step setup and development walkthrough (no AI needed)

---

## Running tests

```bash
npm test
```

Property-based tests use [fast-check](https://fast-check.dev) with a minimum of 100 iterations each.
