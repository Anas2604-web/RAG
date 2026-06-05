# AgenticRAG — Project Overview

## Project Title

**AgenticRAG: An Intelligent Document Question-Answering System using Agentic Retrieval-Augmented Generation with LangGraph and Large Language Models**

---

## About

**AgenticRAG** is an intelligent document question-answering system built as a **major project** by **Arvinder** and **Anas Khan**. It lets users upload documents, ask questions, and get answers grounded in their own sources — with citations, session history, and a research workspace UI.

The system uses **agentic RAG**: documents are parsed, chunked, embedded, and stored in a vector database. A **LangGraph** ReAct agent orchestrates multi-step retrieval with **large language models**, synthesizing cited answers instead of relying on the LLM alone.

---

## Features

### Document research
- Upload **PDF, DOCX, TXT, and Markdown** files
- Automatic parsing, chunking, and embedding
- **Source-first layout** — documents are the primary focus of the workspace
- Select one or more sources to scope every query

### AI Q&A
- Ask natural-language questions about selected documents
- **Agentic retrieval** with multi-step reasoning via **LangGraph**
- Answers linked to exact source passages
- Named **research sessions** with saved chat history

### Source context panel
- **Citation previews** — expandable passages from cited chunks
- **AI-generated insights** — summaries of sources, citations, and latest answers
- **Knowledge graph** — visual map of source-to-query connections

### User & workspace
- Secure sign-up and login (NextAuth)
- Session switcher in the workspace header
- Light, reading-focused UI (NotebookLM + Notion + Perplexity inspired)

### Tech highlights
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **LangGraph** + **LangChain** agent orchestration
- **Qdrant** vector search
- **MongoDB** for users and sessions
- Swappable LLM and embedding providers (OpenAI, Together AI, Ollama, Hugging Face)

---

## LinkedIn Caption

Excited to share our major project 🚀

**AgenticRAG** — An Intelligent Document Question-Answering System using Agentic RAG with LangGraph and LLMs.

Built by me and my teammate Anas Khan 👇

✅ Upload PDF, DOCX, TXT & Markdown
✅ Source-first 3-panel layout (docs · chat · citations)
✅ Agentic Q&A with cited answers via LangGraph + LangChain
✅ Citation previews, AI insights & knowledge graph
✅ Named research sessions with auth

Stack: Next.js · React · TypeScript · LangGraph · Qdrant · MongoDB

Great teamwork on this one — proud of what we shipped together!

#AgenticRAG #AI #RAG #LangGraph #LangChain #LLM #NextJS #MachineLearning #FullStack #GenerativeAI #BuildInPublic #MajorProject #TeamProject

---

**When posting on LinkedIn:** type `@` and select **Anas Khan** from the tag menu so they get notified. Replace the name above if their LinkedIn profile uses a different display name.
