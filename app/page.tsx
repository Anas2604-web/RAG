export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 text-2xl">⬡</span>
          <span className="font-semibold text-lg tracking-tight">AgenticRAG</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-gray-400">
          <a href="/docs/architecture.md" className="hover:text-white transition-colors">Docs</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8 py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Powered by open-source models · LangChain · Qdrant
        </div>

        <h1 className="max-w-2xl text-5xl font-bold tracking-tight leading-tight">
          Ask questions across{" "}
          <span className="text-indigo-400">your documents</span>,{" "}
          intelligently
        </h1>

        <p className="max-w-xl text-gray-400 text-lg leading-relaxed">
          Upload PDFs, Markdown, DOCX, or plain text files. A ReAct agent
          retrieves relevant context, rewrites queries, and reasons across
          multiple steps to give you grounded, cited answers — all using
          open-source models.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/chat"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3 font-medium text-sm"
          >
            Open Chat →
          </a>
          <a
            href="/docs/dev-guide.md"
            className="rounded-lg border border-gray-700 hover:border-gray-500 transition-colors px-6 py-3 font-medium text-sm text-gray-300"
          >
            Read the Dev Guide
          </a>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
          {[
            {
              icon: "🔍",
              title: "Agentic Retrieval",
              desc: "ReAct loop with multi-hop retrieval, query rewriting, and metadata filtering.",
            },
            {
              icon: "📄",
              title: "Multi-format Ingestion",
              desc: "Upload PDF, DOCX, TXT, and Markdown. Chunks are embedded and stored in Qdrant.",
            },
            {
              icon: "🔓",
              title: "Fully Open Source",
              desc: "Mistral-7B via Together AI, BAAI/bge embeddings, Qdrant — no proprietary lock-in.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-2"
            >
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
        AgenticRAG · Built with Next.js, LangChain, and Qdrant
      </footer>
    </div>
  );
}
