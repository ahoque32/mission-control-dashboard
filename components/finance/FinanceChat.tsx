'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface FinanceChatProps {
  days?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STARTER_CHIPS = [
  'Where am I overspending?',
  'What subscriptions do I have?',
  'Monthly spending trend',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinanceChat({ days = 30 }: FinanceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setInput('');

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/finance/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, days }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            (errData as { error?: string }).error || `Request failed (${res.status})`
          );
        }

        const data = await res.json();
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to get a response'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [days, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h2 className="text-base font-semibold text-[#ededed]">
            Finance AI Chat
          </h2>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 font-medium">
          Powered by Gemini 2.5 Flash
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px] max-h-[400px] md:max-h-[500px]"
      >
        {/* Empty state with starter chips */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <p className="text-[#888] text-sm mb-4">
              Ask me anything about your finances
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10
                             text-[#ededed] hover:bg-white/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white/5 border border-white/10 rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              ) : (
                <div className="text-sm leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:mt-3 prose-headings:mb-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-[#888] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-[#888] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-[#888] rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your spending..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
                       text-[#ededed] placeholder:text-[#666] focus:outline-none focus:ring-2
                       focus:ring-blue-500/50 resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600
                       rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
