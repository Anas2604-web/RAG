"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export interface SessionMeta {
  _id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: (session: SessionMeta) => void;
}

export default function SessionSidebar({
  activeSessionId,
  onSelectSession,
  onNewSession,
}: Props) {
  const { data: authSession } = useSession();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleNewSession = async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    if (res.ok) {
      const newSession: SessionMeta = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      onNewSession(newSession);
    }
  };

  const startRename = (s: SessionMeta) => {
    setRenamingId(s._id);
    setRenameValue(s.title);
  };

  const commitRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, title: trimmed } : s))
      );
    }
    setRenamingId(null);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s._id !== id);
        if (remaining.length > 0) {
          onSelectSession(remaining[0]._id);
        } else {
          handleNewSession();
        }
      }
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <aside className="w-64 glass-panel rounded-2xl flex flex-col h-full flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="label-caps">Sessions</span>
          <button
            onClick={handleNewSession}
            title="New session"
            className="btn-ghost w-8 h-8 rounded-xl hover:bg-white/10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="avatar-ring flex-shrink-0">
            <div className="w-7 h-7 flex items-center justify-center text-white text-xs font-bold">
              {authSession?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
          <span className="text-sm text-slate-300 truncate font-light">
            {authSession?.user?.name ?? authSession?.user?.email}
          </span>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm font-light">
            Loading…
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm font-light">
            No sessions yet
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s._id}
              className={`group relative mx-2 mb-1 rounded-xl spring-transition ${
                activeSessionId === s._id
                  ? "bg-white/10 border border-white/15 shadow-sm"
                  : "hover:bg-white/5"
              }`}
            >
              {renamingId === s._id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(s._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(s._id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="glass-input w-full px-3 py-2.5 text-sm rounded-xl"
                />
              ) : (
                <button
                  onClick={() => onSelectSession(s._id)}
                  className="w-full text-left px-3 py-2.5 pr-16"
                >
                  <p className="text-sm text-slate-200 truncate leading-snug font-medium">
                    {s.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-light">
                    {formatDate(s.updatedAt)}
                  </p>
                </button>
              )}

              {renamingId !== s._id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={() => startRename(s)}
                    title="Rename"
                    className="btn-ghost w-6 h-6 rounded-lg"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSession(s._id)}
                    title="Delete"
                    className="btn-ghost w-6 h-6 rounded-lg hover:text-red-400"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 spring-transition text-sm w-full font-light"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
