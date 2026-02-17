// components/chat/ChatMessage.tsx - Single message bubble
'use client';

import { Message } from '@/hooks/useChat';
import { getAgentById } from '@/lib/agents';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  agentId?: string;
}

export default function ChatMessage({ message, agentId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const agent = agentId ? getAgentById(agentId) : undefined;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
        ${isUser 
          ? 'bg-emerald-500/20 text-emerald-400' 
          : agent?.bgColor || 'bg-purple-500/15'
        }
      `}>
        {isUser ? '👤' : agent?.emoji || '🤖'}
      </div>

      {/* Message Bubble */}
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3
        ${isUser 
          ? 'bg-emerald-500/15 text-foreground border border-emerald-500/20' 
          : 'bg-card text-foreground border border-border'
        }
      `}>
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto my-2">
                    <code className="text-sm font-mono">{children}</code>
                  </pre>
                );
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {message.content || (message.isStreaming ? '▊' : '')}
          </ReactMarkdown>
        </div>
        
        {/* Streaming indicator */}
        {message.isStreaming && message.content && (
          <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1"></span>
        )}
      </div>
    </div>
  );
}
