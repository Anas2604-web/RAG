'use client';

import { ReActTrace } from '@/types/index';
import { formatTrace } from '@/lib/agents/pretty-printer';
import { useState } from 'react';

interface AgentTraceProps {
  trace: ReActTrace;
}

export default function AgentTrace({ trace }: AgentTraceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== 'development' || !trace || trace.length === 0) {
    return null;
  }

  const formattedTrace = formatTrace(trace);

  return (
    <div className="mt-2 surface-card rounded-lg p-3 border-amber-200 bg-amber-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-xs font-semibold text-amber-800 flex items-center justify-between"
      >
        <span>Agent trace</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <pre className="mt-2 text-xs text-amber-900 bg-white p-2 rounded border border-amber-100 overflow-x-auto max-h-40 overflow-y-auto font-mono">
          {formattedTrace}
        </pre>
      )}
    </div>
  );
}
