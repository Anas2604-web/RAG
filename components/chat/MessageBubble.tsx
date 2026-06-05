'use client';

import { Citation } from '@/types/index';
import { useDocumentSelection } from '@/components/documents/DocumentSelectionProvider';

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
  const { setActiveCitations, setSelectedCitation, setLatestAnswer } =
    useDocumentSelection();

  const handleCitationClick = (citation: Citation) => {
    setActiveCitations(citations);
    setSelectedCitation(citation);
    setLatestAnswer(content);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] px-4 py-3 rounded-lg ${
          isUser ? 'bubble-user' : 'bubble-assistant'
        }`}
      >
        <p className={`prose-chat whitespace-pre-wrap break-words ${isUser ? 'text-white' : ''}`}>
          {content}
        </p>

        {!isUser && citations.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {citations.map((citation, i) => (
              <button
                key={citation.chunkId}
                onClick={() => handleCitationClick(citation)}
                className="citation-chip"
              >
                [{i + 1}] {citation.filename.split('.')[0].slice(0, 16)}
              </button>
            ))}
          </div>
        )}

        <p className={`text-[0.625rem] mt-2 ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
          {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
