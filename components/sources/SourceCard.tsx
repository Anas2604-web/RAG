"use client";

import { DocumentMetaData } from "@/types/index";
import { useState } from "react";
import { useDocumentSelection } from "@/components/documents/DocumentSelectionProvider";

interface Props {
  document: DocumentMetaData;
  sessionId: string;
  onDelete: (id: string) => void;
}

function fileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("docx")) return "DOC";
  if (mimeType.includes("text") || mimeType.includes("markdown")) return "TXT";
  return "FILE";
}

export default function SourceCard({ document, sessionId, onDelete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedDocIds, setSelectedDocIds } = useDocumentSelection();
  const isSelected = selectedDocIds.includes(document.id);

  const toggleSelect = () => {
    setSelectedDocIds((prev) =>
      prev.includes(document.id)
        ? prev.filter((id) => id !== document.id)
        : [...prev, document.id]
    );
  };

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
  });

  const sizeKb = Math.round(document.sizeBytes / 1024);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggleSelect}
      onKeyDown={(e) => e.key === "Enter" && toggleSelect()}
      className={`w-full text-left p-3 rounded-lg spring-transition group cursor-pointer ${
        isSelected ? "surface-card-selected" : "surface-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[0.625rem] font-bold text-blue-600">
            {fileIcon(document.mimeType)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate" title={document.filename}>
            {document.filename}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {uploadedAt} · {document.chunkCount} chunks · {sizeKb} KB
          </p>
          {isSelected && (
            <span className="source-badge mt-1.5">Active source</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={isDeleting}
          className="btn-ghost w-7 h-7 opacity-0 group-hover:opacity-100 hover:text-red-500 disabled:opacity-40 flex-shrink-0"
          title="Delete"
        >
          {isDeleting ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
