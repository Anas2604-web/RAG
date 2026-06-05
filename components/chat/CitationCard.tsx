'use client';

import { Citation } from '@/types/index';
import { useState } from 'react';

interface CitationCardProps {
  citation: Citation;
}

export default function CitationCard({ citation }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="surface-card rounded-lg p-2.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-xs font-medium text-slate-700 flex items-center justify-between"
      >
        <span className="truncate">
          {citation.filename} (chunk {citation.chunkIndex + 1})
        </span>
        <span className="text-xs ml-2 flex-shrink-0 text-slate-400">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 reading-text text-sm p-2.5 bg-slate-50 rounded-md max-h-32 overflow-y-auto">
          {citation.text}
        </div>
      )}
    </div>
  );
}
