"use client";

import { DocumentMetaData } from "@/types/index";
import { useState } from "react";

interface Props {
  document: DocumentMetaData;
  sessionId: string;
  onDelete: (id: string) => void;
}

export default function DocumentRow({ document, sessionId, onDelete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${document.filename}"?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/documents/${document.id}?sessionId=${sessionId}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        onDelete(document.id);
      } else {
        alert("Failed to delete document");
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadedAt = new Date(document.uploadedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sizeKb = Math.round(document.sizeBytes / 1024);

  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-750 transition-colors group">
      <div className="flex-1 min-w-0 mr-2">
        <p
          className="text-xs font-medium text-slate-200 truncate"
          title={document.filename}
        >
          {document.filename}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {uploadedAt} · {document.chunkCount} chunks · {sizeKb} KB
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 disabled:opacity-40 transition-colors"
        title="Delete document"
      >
        {isDeleting ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
}
