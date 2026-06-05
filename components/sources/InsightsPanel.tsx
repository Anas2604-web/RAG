"use client";

import { useDocumentSelection } from "@/components/documents/DocumentSelectionProvider";

export default function InsightsPanel() {
  const { documents, selectedDocIds, activeCitations, latestAnswer } =
    useDocumentSelection();

  const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));
  const totalChunks = selectedDocs.reduce((sum, d) => sum + d.chunkCount, 0);
  const uniqueSources = new Set(activeCitations.map((c) => c.documentId)).size;

  const insights: { label: string; value: string }[] = [];

  if (selectedDocs.length > 0) {
    insights.push({
      label: "Sources in scope",
      value: `${selectedDocs.length} document${selectedDocs.length !== 1 ? "s" : ""} · ${totalChunks} chunks indexed`,
    });
  }

  if (activeCitations.length > 0) {
    insights.push({
      label: "Citations in latest answer",
      value: `${activeCitations.length} passage${activeCitations.length !== 1 ? "s" : ""} from ${uniqueSources} source${uniqueSources !== 1 ? "s" : ""}`,
    });
  }

  if (latestAnswer) {
    const summary =
      latestAnswer.length > 180
        ? latestAnswer.slice(0, 180).trim() + "…"
        : latestAnswer;
    insights.push({
      label: "Latest synthesis",
      value: summary,
    });
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-slate-500">
          Insights appear after you query your sources.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {insights.map((insight) => (
        <div key={insight.label} className="insight-card animate-fade-in">
          <p className="label-caps mb-1">{insight.label}</p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {insight.value}
          </p>
        </div>
      ))}
    </div>
  );
}
