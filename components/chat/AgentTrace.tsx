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
    <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-xs font-semibold text-yellow-900 hover:text-yellow-700 flex items-center justify-between"
      >
        <span>Agent Reasoning Trace</span>
        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <pre className="mt-2 text-xs text-yellow-800 bg-white p-2 rounded overflow-x-auto max-h-48 overflow-y-auto border border-yellow-200">
          {formattedTrace}
        </pre>
      )}
    </div>
  );
}
