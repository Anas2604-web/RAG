"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageBubble from "./MessageBubble";
import AgentTrace from "./AgentTrace";
import { Citation, ReActTrace } from "@/types/index";
import { useDocumentSelection } from "@/components/documents/DocumentPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  trace?: ReActTrace;
}

interface Props {
  sessionId: string;
  onTitleChange?: (title: string) => void;
}

export default function ChatWindow({ sessionId, onTitleChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedDocIds } = useDocumentSelection();

  // Load session history whenever sessionId changes
  useEffect(() => {
    if (!sessionId) return;
    setMessages([]);
    setLoadingHistory(true);

    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          const loaded: Message[] = data.messages.map(
            (m: {
              _id: string;
              role: "user" | "assistant";
              content: string;
              createdAt: string;
              citations?: Citation[];
              trace?: ReActTrace;
            }) => ({
              id: m._id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt),
              citations: m.citations ?? [],
              trace: m.trace ?? [],
            })
          );
          setMessages(loaded);
        }
        if (data.title && onTitleChange) onTitleChange(data.title);
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          sessionId,
          documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.answer ?? "",
        timestamp: new Date(),
        citations: data.citations ?? [],
        trace: data.trace,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reflect auto-title update in the sidebar
      if (messages.length === 0 && onTitleChange) {
        const title =
          query.length > 50 ? query.slice(0, 50) + "…" : query;
        onTitleChange(title);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex justify-center items-center h-full text-slate-500 text-sm">
            Loading history…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">Start a conversation</p>
            <p className="text-slate-600 text-sm mt-1">
              Upload a document and ask a question
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              <MessageBubble
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                citations={message.citations}
              />
              {message.trace && message.trace.length > 0 && (
                <AgentTrace trace={message.trace} />
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-200 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={
              selectedDocIds.length > 0
                ? `Ask from ${selectedDocIds.length} selected source${selectedDocIds.length !== 1 ? "s" : ""}…`
                : "Ask a question…"
            }
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-slate-200 placeholder-slate-500 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 transition-colors font-medium text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
