"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { SessionMeta } from "@/components/sessions/SessionSidebar";

interface Props {
  sessionTitle: string;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: (session: SessionMeta) => void;
}

export default function WorkspaceHeader({
  sessionTitle,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: Props) {
  const { data: authSession } = useSession();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) setSessions(await res.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
  }, [fetchSessions, activeSessionId]);

  const handleNewSession = async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Research" }),
    });
    if (res.ok) {
      const session: SessionMeta = await res.json();
      setSessions((prev) => [session, ...prev]);
      onNewSession(session);
      setShowMenu(false);
    }
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-900 tracking-tight">
          Research Workspace
        </span>
      </div>

      <div className="h-5 w-px bg-slate-200" />

      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-50 spring-transition text-sm"
        >
          <span className="font-medium text-slate-800 truncate max-w-[200px]">
            {sessionTitle}
          </span>
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 animate-fade-in">
            <button
              onClick={handleNewSession}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
            >
              + New research session
            </button>
            <div className="border-t border-slate-100 my-1" />
            <div className="max-h-48 overflow-y-auto">
              {sessions.map((s) => (
                <button
                  key={s._id}
                  onClick={() => {
                    onSelectSession(s._id);
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm spring-transition ${
                    s._id === activeSessionId
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 hidden sm:inline">
          {authSession?.user?.name ?? authSession?.user?.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost text-xs px-2 py-1"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
