'use client';

import { Citation } from '@/types/index';
import { useState } from 'react';

interface CitationCardProps {
  citation: Citation;
}

export default function CitationCard({ citation }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-xs font-medium text-slate-300 hover:text-slate-100 flex items-center justify-between transition-colors"
      >
        <span className="truncate">
          {citation.filename} (chunk {citation.chunkIndex})
        </span>
        <span className="text-xs ml-2 flex-shrink-0">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="mt-2 text-xs text-slate-400 bg-slate-950 p-2 rounded max-h-32 overflow-y-auto">
          {citation.text}
        </div>
      )}
    </div>
  );
}
