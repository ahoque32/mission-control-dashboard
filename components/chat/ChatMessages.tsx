// components/chat/ChatMessages.tsx - Message list with auto-scroll
'use client';

import { useRef, useEffect } from 'react';
import { Message } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';

interface ChatMessagesProps {
  messages: Message[];
  agentId: string;
  error: string | null;
}

export default function ChatMessages({ messages, agentId, error }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">👋</div>
          <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
          <p className="text-sm text-foreground-secondary max-w-sm">
            Select an agent from the sidebar and type a message to begin chatting.
            Your conversations are private and secure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage 
          key={message.id} 
          message={message} 
          agentId={agentId}
        />
      ))}
      
      {error && (
        <div className="flex justify-center">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
            Error: {error}
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
