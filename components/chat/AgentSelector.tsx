// components/chat/AgentSelector.tsx - Dropdown to select which agent to chat with
'use client';

import { AGENTS } from '@/lib/agents';

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  disabled?: boolean;
}

export default function AgentSelector({ selectedAgentId, onSelectAgent, disabled }: AgentSelectorProps) {
  const selectedAgent = AGENTS.find(a => a.id === selectedAgentId) || AGENTS[0];

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-foreground-secondary mb-1.5 uppercase tracking-wide">
        Select Agent
      </label>
      <select
        value={selectedAgentId}
        onChange={(e) => onSelectAgent(e.target.value)}
        disabled={disabled}
        className={`
          w-full appearance-none rounded-xl px-4 py-3 pr-10
          bg-card border border-border
          text-foreground text-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        `}
      >
        {AGENTS.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.emoji} {agent.name} — {agent.model}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-[34px] pointer-events-none text-foreground-muted">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {selectedAgent && (
        <p className="mt-2 text-xs text-foreground-secondary">
          {selectedAgent.description}
        </p>
      )}
    </div>
  );
}
