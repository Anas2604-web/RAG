"use client";

import { useState } from "react";
import { Citation } from "@/types/index";
import { useDocumentSelection } from "@/components/documents/DocumentSelectionProvider";

interface Props {
  citation: Citation;
}

export default function CitationPreview({ citation }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { selectedCitation, setSelectedCitation } = useDocumentSelection();
  const isActive = selectedCitation?.chunkId === citation.chunkId;

  return (
    <div
      className={`surface-card rounded-lg overflow-hidden spring-transition ${
        isActive ? "surface-card-selected" : ""
      }`}
    >
      <button
        onClick={() => {
          setSelectedCitation(isActive ? null : citation);
          setExpanded(!expanded);
        }}
        className="w-full text-left p-3 flex items-start gap-2.5"
      >
        <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 text-[0.625rem] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {citation.chunkIndex + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {citation.filename}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Chunk {citation.chunkIndex + 1}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 spring-transition ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 animate-fade-in">
          <div className="reading-text p-3 bg-slate-50 rounded-md border border-slate-100 max-h-48 overflow-y-auto text-sm">
            {citation.text}
          </div>
        </div>
      )}
    </div>
  );
}
