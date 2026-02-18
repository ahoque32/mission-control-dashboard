// components/chat/ChatShell.tsx - Main chat container
'use client';

import { useState, useCallback, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import AgentSelector from './AgentSelector';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatShell() {
  const [selectedAgentId, setSelectedAgentId] = useState('main');
  const sessionIdRef = useRef(`s-${Date.now()}`);
  const { messages, isStreaming, error, sendMessage, abort, clearMessages } = useChat({
    agentId: selectedAgentId,
    sessionId: sessionIdRef.current,
  });

  const handleSend = useCallback((content: string) => {
    sendMessage(content);
  }, [sendMessage]);

  const handleAgentChange = useCallback((newAgentId: string) => {
    if (newAgentId !== selectedAgentId) {
      setSelectedAgentId(newAgentId);
      sessionIdRef.current = `s-${Date.now()}`;
      clearMessages();
    }
  }, [selectedAgentId, clearMessages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Agent Chat</h1>
              <p className="text-sm text-foreground-secondary">
                Chat with any OpenClaw agent directly from the dashboard
              </p>
            </div>
            
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                disabled={isStreaming}
                className="px-3 py-1.5 text-sm text-foreground-secondary hover:text-foreground border border-border hover:border-foreground/30 rounded-lg transition-colors disabled:opacity-50"
              >
                Clear Chat
              </button>
            )}
          </div>
          
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleAgentChange}
            disabled={isStreaming}
          />
        </div>
      </div>

      {/* Messages */}
      <ChatMessages 
        messages={messages} 
        agentId={selectedAgentId}
        error={error}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        onAbort={abort}
        disabled={false}
      />
    </div>
  );
}
