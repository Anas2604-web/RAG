# Tasks: Agentic RAG System

## Task List

### 1. Project Setup and Dependencies

- [ ] 1.1 Install core runtime dependencies
  - `npm install langchain @langchain/core @langchain/community @langchain/openai @langchain/ollama`
  - `npm install @qdrant/js-client-rest`
  - `npm install pdf-parse mammoth`
  - `npm install pino`
  - `npm install zod`
  - `npm install uuid`

- [ ] 1.2 Install dev/test dependencies
  - `npm install -D fast-check vitest @vitest/coverage-v8`
  - `npm install -D @types/uuid @types/pdf-parse`

- [ ] 1.3 Add vitest config to `package.json` scripts
  - Add `"test": "vitest --run"` and `"test:watch": "vitest"` scripts

- [ ] 1.4 Create `types/index.ts` with all shared TypeScript interfaces
  - `DocumentMetadata`, `DocumentChunk`, `Session`, `ChatMessage`, `Citation`, `SSEEvent`, `MetadataFilter`, `ReActTrace`

- [ ] 1.5 Move default Next.js boilerplate to `archive/`
  - Move `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` → `archive/public/`
  - Move default `app/page.tsx` content to `archive/page.tsx.bak` (keep the file, replace content)
  - Move default `app/globals.css` boilerplate styles to `archive/globals.css.bak`
  - Add `archive/README.md` explaining what was moved and why

---

### 2. Environment Configuration

- [ ] 2.1 Create `lib/config/env.ts`
  - Use `zod` to define and validate all env vars from the schema in design.md
  - Implement conditional required logic (e.g., `TOGETHER_API_KEY` required only when `LLM_PROVIDER=together`)
  - Export a typed `config` object
  - On validation failure, log the missing variable name and throw (process will exit)

- [ ] 2.2 Create `.env.example`
  - List every variable from the design's Environment Variable Schema table
  - Include inline comments describing each variable and whether it is required or optional

- [ ] 2.3 Add `.env.local` to `.gitignore` (verify it is already present)

- [ ] 2.4 Write unit tests for `lib/config/env.ts`
  - Test that each required variable triggers a descriptive error when absent
  - Test that defaults are applied correctly for optional variables

---

### 3. Logging

- [ ] 3.1 Create `lib/logging/logger.ts`
  - Instantiate a `pino` logger with `service: "agentic-rag"` in the base bindings
  - Read log level from `config.LOG_LEVEL`
  - Export a singleton `logger` instance

- [ ] 3.2 Create `lib/agent/pretty-printer.ts`
  - Implement `formatTrace(trace: ReActTrace): string`
  - Format each step as `[Step N]\n  Thought: ...\n  Action: ...\n  Input: ...\n  Observation: ...`
  - Only active when `NODE_ENV === "development"`

- [ ] 3.3 Write property tests for `pretty-printer.ts`
  - `// Feature: agentic-rag, Property 27: Pretty printer produces human-readable trace`
  - Use `fast-check` to generate arbitrary `ReActTrace` arrays with ≥1 step
  - Assert output contains "Thought", "Action", "Observation"
  - Minimum 100 iterations

---

### 4. Qdrant Integration

- [ ] 4.1 Create `lib/vectorstore/qdrant-client.ts`
  - Instantiate `QdrantClient` from `@qdrant/js-client-rest` using `config.QDRANT_URL` and optional `config.QDRANT_API_KEY`
  - Export a singleton client
  - Wrap connection in a 5-second timeout; throw a typed `VectorStoreError` on failure

- [ ] 4.2 Create `lib/vectorstore/retriever.ts`
  - Implement `retrieve(query: string, k: number, filter?: MetadataFilter): Promise<DocumentChunk[]>`
  - Embed the query using the `EmbeddingService`
  - Call `qdrantClient.search(collection, { vector, limit: k, filter })`
  - Map Qdrant results to `DocumentChunk[]`
  - Log each retrieval at DEBUG level (Property 25)

- [ ] 4.3 Implement collection management helpers in `qdrant-client.ts`
  - `ensureCollection(name: string, dimension: number)`: create collection if it doesn't exist
  - `deleteCollection(name: string)`: delete collection and all its points
  - `collectionExists(name: string): Promise<boolean>`

- [ ] 4.4 Write property tests for `retriever.ts`
  - `// Feature: agentic-rag, Property 5: Retriever returns at most k results`
  - `// Feature: agentic-rag, Property 6: Metadata filter is respected`
  - `// Feature: agentic-rag, Property 7: Collection isolation`
  - `// Feature: agentic-rag, Property 8: Collection deletion removes all data`
  - Use in-memory mock of Qdrant client; minimum 100 iterations each

---

### 5. Embedding Model

- [ ] 5.1 Create `lib/embeddings/embedder.ts`
  - Implement `createEmbeddingService(config): EmbeddingService` factory
  - `huggingface` branch: use `HuggingFaceInferenceEmbeddings` from `@langchain/community`
  - `ollama` branch: use `OllamaEmbeddings` from `@langchain/ollama`
  - Cache the vector dimension after the first call
  - Implement `getDimension(): number`

- [ ] 5.2 Implement dimension validation in `embedder.ts`
  - Before writing to an existing collection, compare `getDimension()` against the collection's configured vector size
  - Throw a typed `DimensionMismatchError` with a descriptive message if they differ

- [ ] 5.3 Write property tests for `embedder.ts`
  - `// Feature: agentic-rag, Property 2: Embedding count matches chunk count`
  - `// Feature: agentic-rag, Property 22: Embedding model is read from environment`
  - `// Feature: agentic-rag, Property 23: Consistent embedding dimension within a collection`
  - Use a mock embedding function that returns fixed-dimension vectors; minimum 100 iterations

---

### 6. Document Store

- [ ] 6.1 Create `lib/docstore/doc-store.ts`
  - Implement `saveDocument(meta: DocumentMetadata): Promise<void>`
  - Implement `getDocument(id: string): Promise<DocumentMetadata | null>`
  - Implement `listDocuments(): Promise<DocumentMetadata[]>`
  - Implement `deleteDocument(id: string): Promise<void>`
  - Back-end: read/write `data/documents.json` (create file if absent)
  - Use file locking or sequential writes to avoid race conditions

- [ ] 6.2 Ensure `data/` directory and `data/documents.json` are created on first run
  - Add `data/documents.json` to `.gitignore`

---

### 7. Ingestion Pipeline

- [ ] 7.1 Create `lib/ingestion/parser.ts`
  - Implement `parseFile(buffer: Buffer, filename: string): Promise<string>`
  - PDF: use `pdf-parse`
  - DOCX: use `mammoth`
  - TXT / MD: `buffer.toString("utf-8")`
  - Throw `UnsupportedFormatError` for any other extension

- [ ] 7.2 Create `lib/ingestion/splitter.ts`
  - Implement `splitText(text: string, chunkSize: number, overlap: number): string[]`
  - Use LangChain's `RecursiveCharacterTextSplitter`
  - Return array of chunk strings

- [x] 7.3 Create `lib/ingestion/pipeline.ts`
  - Implement `ingest(buffer: Buffer, filename: string, mimeType: string, collection?: string): Promise<DocumentMetadata>`
  - Orchestrate: validate → parse → split → embed → dimension-check → upsert to Qdrant → save to DocStore
  - Implement atomicity: if Qdrant upsert succeeds but DocStore write fails, issue compensating Qdrant delete
  - Log ingestion start/end at INFO level; log each step at DEBUG level

- [x] 7.4 Write unit tests for `parser.ts`
  - One test per supported file type using small fixture files in `__tests__/fixtures/`
  - One test for unsupported extension returning `UnsupportedFormatError`

- [x] 7.5 Write property tests for `splitter.ts` and `pipeline.ts`
  - `// Feature: agentic-rag, Property 1: Chunk size invariant`
  - `// Feature: agentic-rag, Property 3: Ingestion round-trip`
  - `// Feature: agentic-rag, Property 4: Embedding service failure prevents partial writes`
  - `// Feature: agentic-rag, Property 18: Ingest API response contains required metadata fields`
  - Use `fast-check` to generate arbitrary text strings; minimum 100 iterations

---

### 8. LLM Factory

- [ ] 8.1 Create `lib/llm/llm-factory.ts`
  - Implement `createLLM(config): BaseChatModel` factory
  - `together` branch: use `ChatOpenAI` with `baseURL: "https://api.together.xyz/v1"` and `TOGETHER_API_KEY`
  - `huggingface` branch: use `ChatHuggingFace` from `@langchain/community`
  - `ollama` branch: use `ChatOllama` from `@langchain/ollama` with `config.OLLAMA_BASE_URL`
  - All branches use LangChain's `BaseChatModel` abstraction

- [ ] 8.2 Implement `sanitizeError(err: unknown): string` in `lib/llm/llm-factory.ts`
  - Strip HTTP status codes, API keys, and provider-internal fields from error messages
  - Return a generic user-readable string

- [ ] 8.3 Write property tests for `llm-factory.ts`
  - `// Feature: agentic-rag, Property 9: LLM provider is read from environment`
  - `// Feature: agentic-rag, Property 10: LLM errors are sanitized`
  - Use `fast-check` to generate arbitrary error objects; minimum 100 iterations

---

### 9. Agent and Tools

- [ ] 9.1 Create `lib/agent/tools.ts`
  - Define `retrieverTool`: wraps `retriever.retrieve()`, returns formatted chunk list as string
  - Define `metadataFilterRetrieverTool`: wraps `retriever.retrieve()` with filter param
  - Define `queryRewriterTool`: calls LLM with a focused rewrite prompt, returns 1–3 alternatives
  - Each tool logs its name, input, and duration at DEBUG level (Property 25)

- [ ] 9.2 Create `lib/agent/agent.ts`
  - Implement `createAgent(sessionId: string): AgentExecutor`
  - Use LangChain's `createReactAgent` with the three tools from 9.1
  - Configure `maxIterations: config.AGENT_MAX_STEPS`
  - Attach `BufferMemory` keyed by `sessionId` (server-side Map)
  - On max steps reached, append `"[Note: reasoning was incomplete — maximum steps reached]"` to the output
  - Log agent invocation start/end at INFO level (Property 24)

- [ ] 9.3 Implement citation extraction in `lib/agent/agent.ts`
  - After agent finishes, scan the intermediate steps for tool observations
  - Extract `DocumentChunk` objects, deduplicate by chunk ID
  - Return `{ answer: string, citations: Citation[], trace?: ReActTrace }`

- [ ] 9.4 Implement session management in `lib/agent/agent.ts`
  - Server-side `Map<string, Session>` for active sessions
  - `getOrCreateSession(sessionId?: string): Session`
  - `clearSession(sessionId: string): void`

- [ ] 9.5 Write property tests for `tools.ts` and `agent.ts`
  - `// Feature: agentic-rag, Property 11: Query rewriter produces 1–3 alternatives`
  - `// Feature: agentic-rag, Property 12: ReAct loop step limit enforced with partial answer`
  - `// Feature: agentic-rag, Property 13: Final answer always includes citations`
  - `// Feature: agentic-rag, Property 15: Session context is maintained across turns`
  - `// Feature: agentic-rag, Property 16: New session clears history`
  - Use mocked LLM and retriever; minimum 100 iterations each

- [ ] 9.6 Write example test for tool list
  - Verify the agent's tool list contains `retriever`, `metadata_filter_retriever`, and `query_rewriter`

---

### 10. API Routes

> Note: Before implementing route handlers, verify the correct export signature and streaming API for Next.js 16 by checking `node_modules/next/dist/docs/` once dependencies are installed.

- [ ] 10.1 Create `app/api/health/route.ts`
  - `GET /api/health`: ping Qdrant, check LLM config, check embedding config
  - Return `{ status, qdrant, llm, embedding }` JSON

- [ ] 10.2 Create `app/api/chat/route.ts`
  - `POST /api/chat`: validate `{ sessionId?, message, collection? }`
  - Return 400 with JSON error body if `message` is missing
  - Create a `ReadableStream` that emits SSE events
  - Call `agent.stream()` and emit `token`, `citation`, `trace` (dev only), `done`, `error` events
  - Log each invocation at INFO level

- [ ] 10.3 Create `app/api/ingest/route.ts`
  - `POST /api/ingest`: parse `multipart/form-data`, extract `file` and optional `collection`
  - Return 400 if no file provided or format unsupported
  - Call `pipeline.ingest()` and return `DocumentMetadata` JSON on success
  - Return 500 with sanitized error on pipeline failure

- [ ] 10.4 Create `app/api/documents/route.ts`
  - `GET /api/documents`: call `docStore.listDocuments()` and return JSON array

- [ ] 10.5 Create `app/api/documents/[id]/route.ts`
  - `DELETE /api/documents/[id]`: look up document, delete from Qdrant and DocStore, return 204
  - Return 404 if document not found

- [ ] 10.6 Write property tests for API routes
  - `// Feature: agentic-rag, Property 14: SSE stream emits multiple events before done`
  - `// Feature: agentic-rag, Property 17: Document deletion round-trip`
  - `// Feature: agentic-rag, Property 19: Documents API returns all ingested documents`
  - `// Feature: agentic-rag, Property 20: Malformed API requests return 400 with JSON error body`
  - Use mocked pipeline, agent, and docstore; minimum 100 iterations

---

### 11. Chat UI

- [ ] 11.1 Create `components/chat/ChatWindow.tsx`
  - Scrollable message list using `overflow-y-auto` with auto-scroll to bottom on new messages
  - Text input with submit on Enter or button click
  - Disable input while streaming (loading state)
  - Show loading spinner while awaiting first token

- [ ] 11.2 Create `components/chat/MessageBubble.tsx`
  - Render user and assistant messages with distinct visual styles
  - Show timestamp
  - Render citations list below assistant messages
  - "Copy to clipboard" button on assistant messages (uses `navigator.clipboard.writeText`)

- [ ] 11.3 Create `components/chat/CitationCard.tsx`
  - Expandable/collapsible card showing source filename, chunk index, and chunk text
  - Collapsed by default; expand on click

- [ ] 11.4 Create `components/chat/AgentTrace.tsx`
  - Only rendered when `NODE_ENV === "development"` and trace data is present
  - Expandable panel showing pretty-printed ReAct trace
  - Collapsed by default

- [ ] 11.5 Implement SSE client logic in `ChatWindow.tsx`
  - Use `fetch` + `ReadableStream` to consume the SSE stream from `POST /api/chat`
  - Parse each `data: {...}` line and dispatch to state
  - Handle `token` (append to current message), `citation` (add to citations), `done` (finalize), `error` (show error)

- [ ] 11.6 Implement "New Session" button in `ChatWindow.tsx`
  - On click: clear local message history, generate new `sessionId`, call `clearSession` via a `DELETE /api/session/[id]` route or reset client-side state

---

### 12. Document Management UI

- [ ] 12.1 Create `components/documents/DropZone.tsx`
  - Accept drag-and-drop file drops
  - Accept file picker via `<input type="file">`
  - Restrict accepted types to `.pdf,.txt,.md,.docx`
  - Show file name and size after selection

- [ ] 12.2 Create `components/documents/DocumentRow.tsx`
  - Display filename, upload timestamp (formatted), chunk count
  - Delete button that calls `DELETE /api/documents/[id]` and removes row on success

- [ ] 12.3 Create `components/documents/DocumentPanel.tsx`
  - Compose `DropZone` and a list of `DocumentRow` components
  - On file selection, call `POST /api/ingest` with `FormData`
  - Show upload progress percentage using `XMLHttpRequest` `progress` event (fetch does not expose upload progress)
  - On success, add new document to list
  - On failure, display the error message from the API response

- [ ] 12.4 Fetch document list on mount in `DocumentPanel.tsx`
  - Call `GET /api/documents` on component mount
  - Populate the document list

---

### 13. Main Page Layout

- [ ] 13.1 Update `app/page.tsx`
  - Two-column layout: `DocumentPanel` on the left, `ChatWindow` on the right
  - Responsive: stack vertically on small screens

- [ ] 13.2 Update `app/globals.css`
  - Remove default Next.js boilerplate styles
  - Add minimal base styles (font, background, box-sizing)

- [ ] 13.3 Update `app/layout.tsx`
  - Set page title to "Agentic RAG"
  - Set appropriate meta description

---

### 14. Logging Integration

- [ ] 14.1 Add structured logging to `lib/ingestion/pipeline.ts`
  - INFO: ingestion start `{ event: "ingestion.start", filename, collection }`
  - INFO: ingestion end `{ event: "ingestion.end", filename, chunkCount, durationMs }`
  - ERROR: any thrown error with stack trace

- [ ] 14.2 Add structured logging to `lib/agent/agent.ts`
  - INFO: `{ event: "agent.invocation", sessionId, query, stepCount, toolCallCount, durationMs }`
  - DEBUG: per tool call `{ event: "agent.tool_call", tool, input, durationMs }`
  - ERROR: agent failure with stack trace

- [ ] 14.3 Write property tests for logging
  - `// Feature: agentic-rag, Property 24: Agent invocation logs are valid structured JSON`
  - `// Feature: agentic-rag, Property 25: Tool call logs contain required fields`
  - `// Feature: agentic-rag, Property 26: Error logs contain stack traces`
  - Capture pino output to a stream in tests; parse and assert fields; minimum 100 iterations

---

### 15. Architecture Document

- [ ] 15.1 Create `docs/architecture.md`
  - Copy and expand the Architecture section from `design.md`
  - Add a "Technology Decisions" section explaining why each library was chosen
  - Add a "Deployment" section describing how to run Qdrant locally (Docker) and on Qdrant Cloud
  - Add a "Scaling Considerations" section (multiple collections, batch ingestion, session persistence)
  - Include all three Mermaid diagrams from the design document

---

### 16. Step-by-Step Development Guide

- [ ] 16.1 Create `docs/dev-guide.md` — a fully self-contained guide requiring no AI assistance
  - **Section 1: Prerequisites** — Node.js version, Docker, accounts needed (Together AI, HF, Qdrant Cloud)
  - **Section 2: Clone and Install** — exact commands to clone repo and run `npm install`
  - **Section 3: Environment Setup** — step-by-step instructions to copy `.env.example` to `.env.local` and fill in each variable, with where to find each API key
  - **Section 4: Start Qdrant Locally** — exact Docker command: `docker run -p 6333:6333 qdrant/qdrant`
  - **Section 5: Run the Dev Server** — `npm run dev`, what to expect in the terminal
  - **Section 6: Upload Your First Document** — walkthrough of the UI upload flow
  - **Section 7: Ask Your First Question** — walkthrough of the chat flow
  - **Section 8: Run Tests** — `npm test`, how to interpret output
  - **Section 9: Switching LLM Providers** — exact env var changes for Together AI → HF → Ollama
  - **Section 10: Switching Embedding Models** — exact env var changes, note about collection dimension mismatch
  - **Section 11: Troubleshooting** — common errors and fixes (missing env var, Qdrant unreachable, dimension mismatch, unsupported file type)

---

### 17. Final Verification

- [ ] 17.1 Run `npm test` and confirm all property tests pass (≥100 iterations each)
- [ ] 17.2 Verify `.env.example` lists every variable used in `lib/config/env.ts`
- [ ] 17.3 Verify `archive/` contains moved boilerplate files and has a README
- [ ] 17.4 Verify `docs/architecture.md` and `docs/dev-guide.md` exist and are complete
- [ ] 17.5 Run `npm run build` and confirm no TypeScript errors
