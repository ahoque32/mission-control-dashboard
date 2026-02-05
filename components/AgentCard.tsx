'use client';

import { Agent } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AgentCardProps {
  agent: Agent;
  currentTask?: string | null;
}

// Helper function to format relative time
function formatRelativeTime(timestamp: Timestamp): string {
  const now = Date.now();
  const then = timestamp.toMillis();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Determine if agent is offline based on last heartbeat
function isOffline(lastHeartbeat: Timestamp): boolean {
  const now = Date.now();
  const then = lastHeartbeat.toMillis();
  const diffMinutes = Math.floor((now - then) / 60000);
  return diffMinutes > 5; // Consider offline if no heartbeat in 5+ minutes
}

// Get status color and label
function getStatusDisplay(agent: Agent) {
  const offline = isOffline(agent.lastHeartbeat);
  
  if (offline) {
    return {
      color: 'bg-[#333]',
      label: 'offline',
      textColor: 'text-[#666]'
    };
  }

  switch (agent.status) {
    case 'active':
      return {
        color: 'bg-green-500',
        label: 'active',
        textColor: 'text-green-400'
      };
    case 'blocked':
      return {
        color: 'bg-red-500',
        label: 'blocked',
        textColor: 'text-red-400'
      };
    case 'idle':
    default:
      return {
        color: 'bg-gray-500',
        label: 'idle',
        textColor: 'text-gray-400'
      };
  }
}

export default function AgentCard({ agent, currentTask }: AgentCardProps) {
  const statusDisplay = getStatusDisplay(agent);

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 hover:border-[#d4a574]/30 transition-all card-hover">
      {/* Header: Emoji + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl leading-none">{agent.emoji}</div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color}`} />
          <span className={`text-xs font-medium uppercase tracking-wide ${statusDisplay.textColor}`}>
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Name and Role */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-[#ededed] mb-1">
          {agent.name}
        </h3>
        <p className="text-sm text-[#888]">{agent.role}</p>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-3 pb-3 border-b border-[#2a2a2a]">
          <p className="text-xs text-[#666] uppercase tracking-wide mb-1">
            Current Task
          </p>
          <p className="text-sm text-[#aaa] line-clamp-2">
            {currentTask}
          </p>
        </div>
      )}

      {/* Last Heartbeat */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#666]">Last heartbeat:</span>
        <span className="text-[#888] font-mono">
          {formatRelativeTime(agent.lastHeartbeat)}
        </span>
      </div>
    </div>
  );
}
