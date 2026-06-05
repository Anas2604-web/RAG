"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionMeta } from "@/components/sessions/SessionSidebar";
import DocumentPanel from "@/components/documents/DocumentPanel";
import ChatWindow from "@/components/chat/ChatWindow";
import SourceContextPanel from "@/components/sources/SourceContextPanel";
import WorkspaceHeader from "@/components/workspace/WorkspaceHeader";
import { DocumentSelectionProvider } from "@/components/documents/DocumentSelectionProvider";

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New Research");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const sessions: SessionMeta[] = await res.json();

      if (sessions.length > 0) {
        setActiveSessionId(sessions[0]._id);
        setSessionTitle(sessions[0].title);
      } else {
        const createRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Research" }),
        });
        if (createRes.ok) {
          const newSession: SessionMeta = await createRes.json();
          setActiveSessionId(newSession._id);
          setSessionTitle(newSession.title);
        }
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.title) setSessionTitle(data.title);
      })
      .catch(console.error);
  }, []);

  const handleNewSession = useCallback((session: SessionMeta) => {
    setActiveSessionId(session._id);
    setSessionTitle(session.title);
  }, []);

  const handleSessionTitleChange = useCallback((title: string) => {
    setSessionTitle(title);
  }, []);

  return (
    <div className="workspace h-screen flex flex-col overflow-hidden">
      <WorkspaceHeader
        sessionTitle={sessionTitle}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Loading workspace…
        </div>
      ) : activeSessionId ? (
        <DocumentSelectionProvider>
          <main className="flex-1 flex overflow-hidden min-h-0">
            {/* Left: Documents (primary) */}
            <div className="w-[340px] border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0 hidden md:flex">
              <DocumentPanel sessionId={activeSessionId} />
            </div>

            {/* Center: Conversation (secondary) */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-2xl mx-auto border-x border-slate-200">
              <ChatWindow
                sessionId={activeSessionId}
                onTitleChange={handleSessionTitleChange}
              />
            </div>

            {/* Right: Citations & Source Context */}
            <div className="w-[380px] border-l border-slate-200 flex flex-col overflow-hidden flex-shrink-0 hidden lg:flex">
              <SourceContextPanel />
            </div>
          </main>
        </DocumentSelectionProvider>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Unable to load session
        </div>
      )}
    </div>
  );
}
