# Requirements Document

## Introduction

An Agentic Retrieval-Augmented Generation (RAG) system built on Next.js that enables users to upload documents, ask questions, and receive answers grounded in those documents. The system goes beyond basic RAG by incorporating agentic capabilities: the LLM can use tools, rewrite queries, perform multi-hop retrieval, and reason across multiple steps before producing a final answer. All AI components (LLMs and vector databases) are open source and cloud-hosted.

## Glossary

- **Agent**: The LangChain agent that orchestrates tool use, query planning, and multi-step reasoning to answer a user query.
- **RAG_Pipeline**: The end-to-end pipeline that retrieves relevant document chunks from the Vector_Store and passes them as context to the LLM.
- **Ingestion_Pipeline**: The pipeline responsible for loading, splitting, embedding, and storing documents in the Vector_Store.
- **Vector_Store**: The open source vector database (Qdrant by default) that stores document embeddings and supports similarity search.
- **Embedding_Model**: The open source text embedding model used to convert text chunks into vector representations.
- **LLM**: The open source large language model (e.g., Mistral, LLaMA 3, Mixtral) hosted via a cloud provider such as Together AI or Hugging Face Inference API.
- **Retriever**: The LangChain component that queries the Vector_Store and returns the top-k relevant document chunks.
- **Tool**: A callable function exposed to the Agent (e.g., retriever, web search, calculator, metadata filter).
- **Chat_Interface**: The Next.js frontend component through which users interact with the Agent via a conversational UI.
- **Document_Store**: The persistent storage layer (file system or object storage) that holds original uploaded documents.
- **Chunk**: A fixed-size or semantically split segment of a document used for embedding and retrieval.
- **Collection**: A named namespace within the Vector_Store that groups embeddings for a specific set of documents.
- **Session**: A single user conversation thread with its own message history.
- **Query_Rewriter**: The Agent sub-component that reformulates a user query to improve retrieval quality.
- **Pretty_Printer**: A component that formats structured data (e.g., retrieved chunks, agent reasoning traces) into human-readable output.

---

## Requirements

### Requirement 1: Document Ingestion

**User Story:** As a user, I want to upload documents (PDF, TXT, Markdown, DOCX) so that the system can answer questions based on their content.

#### Acceptance Criteria

1. WHEN a user uploads a supported document file, THE Ingestion_Pipeline SHALL parse the file into plain text.
2. WHEN a document is parsed, THE Ingestion_Pipeline SHALL split the text into Chunks using a configurable chunk size (default 512 tokens) and overlap (default 64 tokens).
3. WHEN Chunks are produced, THE Ingestion_Pipeline SHALL generate vector embeddings for each Chunk using the Embedding_Model.
4. WHEN embeddings are generated, THE Ingestion_Pipeline SHALL store each Chunk and its embedding in the Vector_Store under the appropriate Collection.
5. IF a file format is not supported, THEN THE Ingestion_Pipeline SHALL return a descriptive error message identifying the unsupported format.
6. IF the Embedding_Model service is unavailable, THEN THE Ingestion_Pipeline SHALL return an error and SHALL NOT partially commit Chunks to the Vector_Store.
7. THE Ingestion_Pipeline SHALL support the following file types: PDF, TXT, Markdown (.md), and DOCX.
8. WHEN a document is successfully ingested, THE Ingestion_Pipeline SHALL store document metadata (filename, upload timestamp, chunk count, collection name) in the Document_Store.

---

### Requirement 2: Vector Storage and Retrieval

**User Story:** As a developer, I want the system to store and retrieve document embeddings efficiently so that relevant context is surfaced for every query.

#### Acceptance Criteria

1. THE Vector_Store SHALL use Qdrant as the default open source vector database.
2. WHEN a similarity search is requested, THE Retriever SHALL return the top-k most semantically similar Chunks (default k=5, configurable up to k=20).
3. WHEN metadata filters are provided with a query, THE Retriever SHALL apply those filters before performing similarity search.
4. THE Vector_Store SHALL support multiple named Collections to isolate document sets.
5. WHEN a Collection is deleted, THE Vector_Store SHALL remove all associated embeddings and metadata from that Collection.
6. IF the Vector_Store is unreachable, THEN THE Retriever SHALL return an error to the Agent within 5 seconds.

---

### Requirement 3: Open Source LLM Integration

**User Story:** As a developer, I want the system to use open source LLMs hosted on cloud providers so that I avoid proprietary model lock-in.

#### Acceptance Criteria

1. THE LLM SHALL be configurable to use any of the following providers: Together AI, Hugging Face Inference API, or Ollama (self-hosted).
2. THE LLM SHALL default to Mistral-7B-Instruct via Together AI.
3. WHEN a provider and model name are set via environment variables, THE RAG_Pipeline SHALL use that provider and model without requiring code changes.
4. WHEN the LLM provider returns an error, THE Agent SHALL surface a user-readable error message and SHALL NOT expose raw API error details to the Chat_Interface.
5. THE LLM integration SHALL use LangChain's chat model abstraction so that switching providers requires only configuration changes.

---

### Requirement 4: Agentic Reasoning and Tool Use

**User Story:** As a user, I want the system to reason across multiple steps and use tools so that it can answer complex, multi-part questions that require more than a single retrieval pass.

#### Acceptance Criteria

1. THE Agent SHALL use a ReAct (Reasoning + Acting) loop to plan and execute tool calls before producing a final answer.
2. THE Agent SHALL have access to at minimum the following tools: Retriever (semantic search), metadata_filter_retriever (filtered search), and query_rewriter (reformulate query for better retrieval).
3. WHEN a user query requires information from multiple document sections, THE Agent SHALL perform multiple Retriever tool calls and synthesize the results.
4. WHEN the Agent determines a query is ambiguous, THE Query_Rewriter SHALL produce up to 3 alternative query formulations and THE Agent SHALL retrieve results for each.
5. THE Agent SHALL limit the ReAct loop to a maximum of 10 steps per query to prevent infinite loops.
6. IF the Agent reaches the maximum step limit without a final answer, THEN THE Agent SHALL return a partial answer with a note indicating the reasoning was incomplete.
7. WHEN the Agent produces a final answer, THE Agent SHALL include citations referencing the source document filename and chunk index for each piece of retrieved evidence.

---

### Requirement 5: Chat Interface

**User Story:** As a user, I want a conversational chat interface so that I can ask questions and receive answers in a natural, iterative way.

#### Acceptance Criteria

1. THE Chat_Interface SHALL display a scrollable message history showing user messages and Agent responses in chronological order.
2. WHEN a user submits a message, THE Chat_Interface SHALL display a loading indicator until the Agent response is received.
3. THE Chat_Interface SHALL support streaming of Agent responses token-by-token so that the user sees output as it is generated.
4. WHEN an Agent response includes citations, THE Chat_Interface SHALL render each citation as an expandable reference showing the source filename and the relevant Chunk text.
5. THE Chat_Interface SHALL maintain Session context across multiple turns within the same browser session.
6. WHEN a user starts a new Session, THE Chat_Interface SHALL clear the message history and reset the Agent's memory.
7. THE Chat_Interface SHALL allow the user to copy any Agent response to the clipboard with a single interaction.

---

### Requirement 6: Document Management UI

**User Story:** As a user, I want to upload and manage my documents through the UI so that I can control what knowledge the Agent has access to.

#### Acceptance Criteria

1. THE Chat_Interface SHALL provide a document upload panel that accepts drag-and-drop and file picker interactions.
2. WHEN a document upload is initiated, THE Chat_Interface SHALL display upload progress as a percentage.
3. WHEN a document is successfully ingested, THE Chat_Interface SHALL display the document name, upload timestamp, and chunk count in a document list.
4. WHEN a user requests deletion of a document, THE Chat_Interface SHALL remove the document's embeddings from the Vector_Store and its metadata from the Document_Store.
5. IF a document upload fails, THEN THE Chat_Interface SHALL display the error message returned by the Ingestion_Pipeline.

---

### Requirement 7: API Layer

**User Story:** As a developer, I want a well-defined API layer so that the frontend and backend are decoupled and the system can be extended or tested independently.

#### Acceptance Criteria

1. THE API Layer SHALL expose the following Next.js Route Handlers: `POST /api/chat`, `POST /api/ingest`, `GET /api/documents`, `DELETE /api/documents/[id]`.
2. WHEN `POST /api/chat` is called with a session ID and user message, THE API Layer SHALL invoke the Agent and stream the response using Server-Sent Events (SSE).
3. WHEN `POST /api/ingest` is called with a file, THE API Layer SHALL invoke the Ingestion_Pipeline and return a JSON response containing document metadata on success.
4. WHEN `GET /api/documents` is called, THE API Layer SHALL return a JSON array of all ingested document metadata records.
5. WHEN `DELETE /api/documents/[id]` is called, THE API Layer SHALL delete the document's embeddings and metadata and return a 204 response on success.
6. IF any API route receives a malformed request, THEN THE API Layer SHALL return a 400 response with a JSON error body describing the validation failure.

---

### Requirement 8: Configuration and Environment

**User Story:** As a developer, I want all external service credentials and tunable parameters to be managed via environment variables so that the system is portable across environments.

#### Acceptance Criteria

1. THE System SHALL read all provider API keys, model names, vector DB connection strings, and chunk size parameters from environment variables at startup.
2. IF a required environment variable is missing at startup, THEN THE System SHALL log a descriptive error identifying the missing variable and SHALL refuse to start.
3. THE System SHALL provide a `.env.example` file listing all required and optional environment variables with descriptions.
4. WHERE Ollama is selected as the LLM provider, THE System SHALL connect to the Ollama endpoint specified by the `OLLAMA_BASE_URL` environment variable.

---

### Requirement 9: Embedding Model

**User Story:** As a developer, I want the system to use an open source embedding model so that document embeddings are generated without proprietary API dependency.

#### Acceptance Criteria

1. THE Embedding_Model SHALL default to `BAAI/bge-small-en-v1.5` served via Hugging Face Inference API or a local Ollama instance.
2. WHEN the embedding model is changed via environment variable, THE Ingestion_Pipeline SHALL use the new model for all subsequent ingestion operations.
3. THE Embedding_Model SHALL produce embeddings of a consistent vector dimension for all Chunks within a single Collection.
4. IF the embedding dimension of a new model differs from an existing Collection's dimension, THEN THE Ingestion_Pipeline SHALL return an error and SHALL NOT write to that Collection.

---

### Requirement 10: Observability and Logging

**User Story:** As a developer, I want structured logs and agent reasoning traces so that I can debug retrieval quality and agent behavior.

#### Acceptance Criteria

1. THE System SHALL emit structured JSON logs for every Agent invocation, including session ID, query, tool calls made, and total step count.
2. WHEN the Agent executes a tool call, THE System SHALL log the tool name, input, and output at the DEBUG level.
3. WHEN an error occurs in any pipeline stage, THE System SHALL log the error with a stack trace at the ERROR level.
4. THE Pretty_Printer SHALL format Agent reasoning traces (ReAct thought/action/observation sequences) into human-readable text for display in development mode.
5. WHERE the environment is set to `development`, THE Chat_Interface SHALL display an expandable "Agent Trace" panel showing the Pretty_Printer output for each response.
