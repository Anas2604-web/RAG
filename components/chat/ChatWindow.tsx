"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageBubble from "./MessageBubble";
import AgentTrace from "./AgentTrace";
import { Citation, ReActTrace } from "@/types/index";
import { useDocumentSelection } from "@/components/documents/DocumentSelectionProvider";

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
  const {
    selectedDocIds,
    setActiveCitations,
    setLatestAnswer,
    setSelectedCitation,
  } = useDocumentSelection();

  useEffect(() => {
    if (!sessionId) return;
    setMessages([]);
    setActiveCitations([]);
    setLatestAnswer("");
    setSelectedCitation(null);
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

          const lastAssistant = [...loaded].reverse().find((m) => m.role === "assistant");
          if (lastAssistant) {
            setLatestAnswer(lastAssistant.content);
            if (lastAssistant.citations?.length) {
              setActiveCitations(lastAssistant.citations);
            }
          }
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
          documentIds: selectedDocIds,
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
      setActiveCitations(data.citations ?? []);
      setLatestAnswer(data.answer ?? "");
      setSelectedCitation(data.citations?.[0] ?? null);

      if (messages.length === 0 && onTitleChange) {
        const title = query.length > 50 ? query.slice(0, 50) + "…" : query;
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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="panel-header flex-shrink-0">
        <h2 className="panel-title">Conversation</h2>
        <p className="panel-subtitle">
          {selectedDocIds.length > 0
            ? `Querying ${selectedDocIds.length} source${selectedDocIds.length !== 1 ? "s" : ""}`
            : "Select sources to begin"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loadingHistory ? (
          <div className="flex justify-center items-center h-full text-slate-400 text-sm">
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-sm font-medium text-slate-600">Ask about your sources</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Select documents on the left, then ask questions here. Citations will appear on the right.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="animate-fade-in">
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
            <div className="bubble-assistant px-4 py-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 flex-shrink-0 bg-slate-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={
              selectedDocIds.length > 0
                ? "Ask a question about your sources…"
                : "Select sources first…"
            }
            disabled={isLoading || selectedDocIds.length === 0}
            className="input-field flex-1 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || selectedDocIds.length === 0}
            className="btn-primary px-4 py-2 text-sm flex-shrink-0"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
