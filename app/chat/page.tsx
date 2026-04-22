"use client";

import { useState, useEffect, useCallback } from "react";
import SessionSidebar, { SessionMeta } from "@/components/sessions/SessionSidebar";
import DocumentPanel from "@/components/documents/DocumentPanel";
import ChatWindow from "@/components/chat/ChatWindow";
import { DocumentSelectionProvider } from "@/components/documents/DocumentSelectionProvider";

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Create or load the first session on mount
  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const sessions: SessionMeta[] = await res.json();

      if (sessions.length > 0) {
        setActiveSessionId(sessions[0]._id);
        setSessionTitle(sessions[0].title);
      } else {
        // No sessions yet — create one
        const createRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });
        if (createRes.ok) {
          const newSession: SessionMeta = await createRes.json();
          setActiveSessionId(newSession._id);
          setSessionTitle(newSession.title);
        }
      }
    };
    bootstrap();
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleNewSession = useCallback((session: SessionMeta) => {
    setActiveSessionId(session._id);
    setSessionTitle(session.title);
  }, []);

  const handleSessionTitleChange = useCallback((title: string) => {
    setSessionTitle(title);
  }, []);

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      {/* Session sidebar */}
      {sidebarOpen && (
        <SessionSidebar
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-semibold text-sm leading-none">
              {sessionTitle}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Agentic RAG</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex overflow-hidden min-h-0">
          {activeSessionId ? (
            <DocumentSelectionProvider>
              {/* Documents panel */}
              <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden flex-shrink-0 hidden lg:flex">
                <DocumentPanel sessionId={activeSessionId} />
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <ChatWindow
                  sessionId={activeSessionId}
                  onTitleChange={handleSessionTitleChange}
                />
              </div>
            </DocumentSelectionProvider>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Loading session…
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
