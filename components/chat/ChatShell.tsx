// components/chat/ChatShell.tsx - Main chat container
'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import AgentSelector from './AgentSelector';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

function ChatSession({ agentId }: { agentId: string }) {
  const { messages, isStreaming, error, sendMessage, abort, clearMessages } = useChat({
    agentId,
    sessionId: `s-${agentId}-${Date.now()}`,
  });

  return (
    <>
      {/* Clear button in a portal-ish way - pass via context if needed */}
      <ChatMessages 
        messages={messages} 
        agentId={agentId}
        error={error}
      />
      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        onAbort={abort}
        disabled={false}
      />
    </>
  );
}

export default function ChatShell() {
  const [selectedAgentId, setSelectedAgentId] = useState('main');
  const [sessionKey, setSessionKey] = useState(() => `${Date.now()}`);

  const handleAgentChange = useCallback((newAgentId: string) => {
    if (newAgentId !== selectedAgentId) {
      setSelectedAgentId(newAgentId);
      setSessionKey(`${Date.now()}`);
    }
  }, [selectedAgentId]);

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
            
            <button
              onClick={() => setSessionKey(`${Date.now()}`)}
              className="px-3 py-1.5 text-sm text-foreground-secondary hover:text-foreground border border-border hover:border-foreground/30 rounded-lg transition-colors"
            >
              Clear Chat
            </button>
          </div>
          
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onSelectAgent={handleAgentChange}
            disabled={false}
          />
        </div>
      </div>

      {/* Key forces full remount when agent or session changes */}
      <ChatSession key={sessionKey} agentId={selectedAgentId} />
    </div>
  );
}
