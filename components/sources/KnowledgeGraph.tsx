"use client";

import { useDocumentSelection } from "@/components/documents/DocumentSelectionProvider";

export default function KnowledgeGraph() {
  const { documents, selectedDocIds, activeCitations } = useDocumentSelection();

  const activeDocs = documents.filter((d) => selectedDocIds.includes(d.id));
  const citedDocIds = new Set(activeCitations.map((c) => c.documentId));

  if (activeDocs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-500">
        Select sources to see connections
      </div>
    );
  }

  const nodes = activeDocs.slice(0, 6);
  const centerX = 120;
  const centerY = 80;
  const radius = 55;

  const nodePositions = nodes.map((_, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const shortName = (name: string) => {
    const base = name.replace(/\.[^.]+$/, "");
    return base.length > 8 ? base.slice(0, 7) + "…" : base;
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 240 160" className="w-full h-auto">
        {/* Center query node */}
        <circle cx={centerX} cy={centerY} r="18" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
        <text x={centerX} y={centerY + 4} textAnchor="middle" className="text-[8px] fill-blue-600 font-semibold">
          Query
        </text>

        {/* Edges and document nodes */}
        {nodes.map((doc, i) => {
          const pos = nodePositions[i];
          const isCited = citedDocIds.has(doc.id);
          return (
            <g key={doc.id}>
              <line
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                className="graph-edge"
                stroke={isCited ? "#2563eb" : undefined}
                strokeDasharray={isCited ? undefined : "4 3"}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r="22"
                fill={isCited ? "#dbeafe" : "#f1f5f9"}
                stroke={isCited ? "#2563eb" : "#cbd5e1"}
                strokeWidth="1.5"
              />
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                className={`text-[7px] font-medium ${isCited ? "fill-blue-700" : "fill-slate-500"}`}
              >
                {shortName(doc.filename)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-2 text-[0.625rem] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-600 inline-block" /> Cited
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-slate-300 inline-block border-dashed" /> In scope
        </span>
      </div>
    </div>
  );
}
