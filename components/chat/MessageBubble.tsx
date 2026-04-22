'use client';

import { Citation } from '@/types/index';
import CitationCard from './CitationCard';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

export default function MessageBubble({
  role,
  content,
  timestamp,
  citations = [],
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-slate-800 text-slate-100 rounded-bl-none'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
        <p className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
          {timestamp.toLocaleTimeString()}
        </p>

        {!isUser && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs font-semibold mb-2 text-slate-300">Sources:</p>
            <div className="space-y-2">
              {citations.map((citation) => (
                <CitationCard key={citation.chunkId} citation={citation} />
              ))}
            </div>
          </div>
        )}

        {!isUser && (
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="mt-2 text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
