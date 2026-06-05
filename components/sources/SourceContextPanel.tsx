"use client";

import { useState } from "react";
import { useDocumentSelection } from "@/components/documents/DocumentSelectionProvider";
import CitationPreview from "./CitationPreview";
import InsightsPanel from "./InsightsPanel";
import KnowledgeGraph from "./KnowledgeGraph";

type Tab = "citations" | "insights" | "graph";

export default function SourceContextPanel() {
  const { activeCitations, selectedCitation } = useDocumentSelection();
  const [tab, setTab] = useState<Tab>("citations");

  const tabs: { id: Tab; label: string }[] = [
    { id: "citations", label: "Citations" },
    { id: "insights", label: "Insights" },
    { id: "graph", label: "Graph" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header flex-shrink-0">
        <h2 className="panel-title">Source Context</h2>
        <p className="panel-subtitle">
          Citations, insights, and knowledge connections
        </p>
      </div>

      <div className="flex border-b border-slate-200 px-3 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2.5 text-xs font-medium spring-transition border-b-2 -mb-px ${
              tab === t.id
                ? "text-blue-600 border-blue-600"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.id === "citations" && activeCitations.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[0.625rem]">
                {activeCitations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {tab === "citations" && (
          <div className="space-y-2">
            {activeCitations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">No citations yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Ask a question to see cited passages from your sources here.
                </p>
              </div>
            ) : (
              activeCitations.map((citation) => (
                <CitationPreview key={citation.chunkId} citation={citation} />
              ))
            )}

            {selectedCitation && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in">
                <p className="label-caps text-blue-600 mb-2">Reading preview</p>
                <p className="reading-text text-sm">{selectedCitation.text}</p>
              </div>
            )}
          </div>
        )}

        {tab === "insights" && <InsightsPanel />}
        {tab === "graph" && <KnowledgeGraph />}
      </div>
    </div>
  );
}
