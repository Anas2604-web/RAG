# Architecture: Agentic RAG System

## Overview

This system is a Next.js 16 application that lets users upload documents and ask questions answered by an agentic LLM pipeline. The agent uses a ReAct (Reasoning + Acting) loop to retrieve relevant document chunks from a Qdrant vector database, reason across multiple retrieval steps, and stream a grounded answer back to the browser.

---

## Component Diagram

```mermaid
graph TD
    subgraph Browser
        UI[Chat UI\nReact Components]
        DocPanel[Document Panel\nUpload / List / Delete]
    end

    subgraph Next.js App Router
        ChatRoute[POST /api/chat\nSSE stream]
        IngestRoute[POST /api/ingest\nMultipart upload]
        DocsRoute[GET /api/documents]
        DeleteRoute[DELETE /api/documents/:id]
    end

    subgraph Agent Layer
        Agent[ReAct Agent\nLangChain AgentExecutor]
        QR[Query Rewriter Tool]
        Retriever[Retriever Tool]
        FilterRetriever[Metadata Filter Retriever Tool]
    end

    subgraph Ingestion Layer
        Parser[Document Parser\npdf-parse / mammoth / fs]
        Splitter[Text Splitter\nRecursiveCharacterTextSplitter]
        Embedder[Embedding Service\nHF Inference API / Ollama]
    end

    subgraph Storage
        Qdrant[(Qdrant\nVector Store)]
        DocStore[(Document Store\nJSON file)]
    end

    subgraph LLM Providers
        TogetherAI[Together AI\nMistral-7B-Instruct]
        HF[HF Inference API]
        Ollama[Ollama\nself-hosted]
    end

    UI -->|SSE fetch| ChatRoute
    DocPanel -->|multipart/form-data| IngestRoute
    DocPanel -->|fetch| DocsRoute
    DocPanel -->|fetch| DeleteRoute

    ChatRoute --> Agent
    Agent --> QR
    Agent --> Retriever
    Agent --> FilterRetriever
    Agent -->|chat completion| TogetherAI
    Agent -->|chat completion| HF
    Agent -->|chat completion| Ollama

    Retriever --> Qdrant
    FilterRetriever --> Qdrant

    IngestRoute --> Parser
    Parser --> Splitter
    Splitter --> Embedder
    Embedder --> Qdrant
    IngestRoute --> DocStore

    DocsRoute --> DocStore
    DeleteRoute --> Qdrant
    DeleteRoute --> DocStore
```

---

## Data Flow: Chat Query

```mermaid
sequenceDiagram
    participant Browser
    participant ChatRoute as POST /api/chat
    participant Agent as ReAct Agent
    participant Retriever
    participant Qdrant
    participant LLM

    Browser->>ChatRoute: {sessionId, message}
    ChatRoute->>Agent: invoke(message, history)
    loop ReAct loop (max 10 steps)
        Agent->>LLM: think(prompt + history + observations)
        LLM-->>Agent: Thought + Action
        Agent->>Retriever: tool_call(query)
        Retriever->>Qdrant: similarity_search(embedding, k)
        Qdrant-->>Retriever: top-k chunks
        Retriever-->>Agent: observation
    end
    Agent->>LLM: final answer (stream)
    LLM-->>ChatRoute: token stream
    ChatRoute-->>Browser: SSE events (token | citation | done)
```

---

## Data Flow: Document Ingestion

```mermaid
sequenceDiagram
    participant Browser
    participant IngestRoute as POST /api/ingest
    participant Parser
    participant Splitter
    participant Embedder
    participant Qdrant
    participant DocStore

    Browser->>IngestRoute: multipart file upload
    IngestRoute->>Parser: parse(file, mimeType)
    Parser-->>IngestRoute: plainText
    IngestRoute->>Splitter: split(text, chunkSize, overlap)
    Splitter-->>IngestRoute: chunks[]
    IngestRoute->>Embedder: embed(chunks[])
    Embedder-->>IngestRoute: vectors[]
    IngestRoute->>Qdrant: upsert(collection, points[])
    IngestRoute->>DocStore: save(metadata)
    IngestRoute-->>Browser: {id, filename, timestamp, chunkCount, collection}
```

---

## Technology Decisions

| Technology | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack TypeScript, built-in Route Handlers for API, SSE support via `ReadableStream` |
| Agent orchestration | LangChain.js | Provider-agnostic LLM abstraction, built-in ReAct agent, memory, and tool support |
| LLM (default) | Mistral-7B-Instruct via Together AI | Open source, strong instruction following, fast inference, no proprietary lock-in |
| Vector DB | Qdrant | Open source, supports payload filtering, named collections, cloud and self-hosted options |
| Embedding model | BAAI/bge-small-en-v1.5 | Open source, 384-dim (small and fast), strong retrieval performance for English text |
| Embedding host | HF Inference API | No local GPU required for development; swappable to Ollama for fully local setup |
| Streaming | Server-Sent Events (SSE) | Simpler than WebSockets for unidirectional server→client streaming; works with `fetch` |
| Logging | pino | Structured JSON output, low overhead, configurable log levels |
| Config validation | zod | Type-safe env var parsing with descriptive error messages |
| Property testing | fast-check | TypeScript-native, works in Node.js, integrates with vitest |
| PDF parsing | pdf-parse | Lightweight, no native dependencies |
| DOCX parsing | mammoth | Clean text extraction from .docx, no LibreOffice dependency |

---

## Deployment

### Local Development (Qdrant via Docker)

```bash
# Start Qdrant
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# Set QDRANT_URL=http://localhost:6333 in .env.local
```

### Qdrant Cloud

1. Create a free cluster at https://cloud.qdrant.io
2. Copy the cluster URL and API key
3. Set `QDRANT_URL=<cluster-url>` and `QDRANT_API_KEY=<api-key>` in `.env.local`

### Fully Local (Ollama)

```bash
# Install Ollama: https://ollama.com
ollama pull mistral          # LLM
ollama pull bge-small-en     # Embedding model

# Set in .env.local:
# LLM_PROVIDER=ollama
# EMBEDDING_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
```

---

## Scaling Considerations

**Multiple document sets**: Use separate Qdrant collections (set `collection` field on ingest). Each collection is isolated — queries to one never return results from another.

**Batch ingestion**: The ingestion pipeline processes one file at a time. For bulk ingestion, call `POST /api/ingest` in parallel with a concurrency limit to avoid overwhelming the embedding API.

**Session persistence**: Sessions are currently held in a server-side in-memory `Map`. This means sessions are lost on server restart and do not work across multiple server instances. For production, replace with Redis or a database-backed session store.

**Document store**: The default `data/documents.json` file store is suitable for development. For production, replace `lib/docstore/doc-store.ts` with a SQLite or PostgreSQL implementation behind the same interface.

**Embedding dimension lock-in**: Once a Qdrant collection is created with a given vector dimension, you cannot change the embedding model without creating a new collection and re-ingesting all documents. Plan your embedding model choice before ingesting production data.
