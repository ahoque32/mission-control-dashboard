'use client';

import { useMemo, useState } from 'react';
import { Agent, Activity } from '../types';
import { useAgentRecentActivity } from '../lib/convex';
import Icon, { IconName } from './ui/Icon';

// Map agent emojis to Bootstrap Icons
const emojiToIcon: Record<string, IconName> = {
  '📚': 'archive',
  '🔍': 'search',     // LEO, Scout
  '🔨': 'tools',      // Ralph - hammer → tools
  '🤖': 'robot',      // Ralph alt
  '🛡️': 'shield-check', // Sentinel
  '👁️': 'eye',        // Sentinel alt
  '👁': 'eye',
};

interface AgentCardProps {
  agent: Agent;
  currentTask?: string | null;
}

// Helper to get ms from a timestamp (number or Timestamp-like)
function getMs(ts: any): number {
  if (typeof ts === 'number') return ts;
  if (ts?.toMillis) return ts.toMillis();
  return 0;
}

// Helper function to format relative time
function formatRelativeTime(timestamp: any): string {
  const now = Date.now();
  const then = getMs(timestamp);
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
function isOffline(lastHeartbeat: any): boolean {
  const now = Date.now();
  const then = getMs(lastHeartbeat);
  const diffMinutes = Math.floor((now - then) / 60000);
  return diffMinutes > 5;
}

// Get heartbeat-based status for border coloring
function getHeartbeatStatus(lastHeartbeat: any): 'active' | 'idle' | 'offline' {
  const now = Date.now();
  const then = getMs(lastHeartbeat);
  const diffMinutes = Math.floor((now - then) / 60000);
  if (diffMinutes <= 5) return 'active';
  if (diffMinutes <= 30) return 'idle';
  return 'offline';
}

const borderColorMap = {
  active: 'border-emerald-500/50',
  idle: 'border-amber-500/50',
  offline: 'border-red-500/50',
};

// Get status color and label
function getStatusDisplay(agent: Agent) {
  const offline = isOffline(agent.lastHeartbeat);
  
  if (offline) {
    return {
      color: 'bg-gray-500',
      label: 'offline',
      textColor: 'text-gray-400'
    };
  }

  switch (agent.status) {
    case 'active':
      return {
        color: 'bg-emerald-500',
        label: 'active',
        textColor: 'text-emerald-400'
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
        color: 'bg-amber-500',
        label: 'idle',
        textColor: 'text-amber-400'
      };
  }
}

export default function AgentCard({ agent, currentTask }: AgentCardProps) {
  const statusDisplay = getStatusDisplay(agent);
  const heartbeatStatus = getHeartbeatStatus(agent.lastHeartbeat);
  const [showActions, setShowActions] = useState(false);
  const { activities, loading: activityLoading } = useAgentRecentActivity(agent.id);

  // Check if agent has recent activity (last 5 min)
  const isActive = useMemo(() => {
    if (!activities.length) return false;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return activities.some((a: any) => getMs(a.createdAt) > fiveMinutesAgo);
  }, [activities]);

  const recentActivity = activities.length > 0 ? activities[0] : null;
  const activeTaskName = recentActivity?.metadata?.taskName as string | undefined;

  return (
    <div
      className={`glass-card p-5 border-l-4 ${borderColorMap[heartbeatStatus]} hover:border-emerald-500/30 transition-all card-hover relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header: Icon + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Icon 
            name={emojiToIcon[agent.emoji] || 'person'} 
            size={28} 
            className="text-emerald-400" 
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color}`} />
            {isActive && (
              <div 
                className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"
                title={activeTaskName ? `Working on: ${activeTaskName}` : 'Active now'}
              />
            )}
          </div>
          <span 
            className={`text-xs font-medium uppercase tracking-wide ${statusDisplay.textColor}`}
            title={isActive && activeTaskName ? `Working on: ${activeTaskName}` : undefined}
          >
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Name and Role */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {agent.name}
        </h3>
        <p className="text-sm text-foreground-secondary">{agent.role}</p>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-3 pb-3 border-b border-white/10">
          <p className="text-xs text-foreground-muted uppercase tracking-wide mb-1">
            Current Task
          </p>
          <p className="text-sm text-foreground-secondary line-clamp-2">
            {currentTask}
          </p>
        </div>
      )}

      {/* Model Name */}
      {(agent as any).model && (
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-foreground-muted">Model:</span>
          <span className="text-foreground-secondary font-mono text-[11px]">{(agent as any).model}</span>
        </div>
      )}

      {/* Last Heartbeat */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground-muted">Last seen:</span>
        <span className="text-foreground-secondary font-mono">
          {formatRelativeTime(agent.lastHeartbeat)}
        </span>
      </div>

      {/* Quick Actions on Hover */}
      {showActions && (
        <div className="absolute bottom-3 right-3 flex gap-1.5 animate-fade-in">
          <button
            className="px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); }}
          >
            Assign Task
          </button>
          <button
            className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); }}
          >
            Message
          </button>
        </div>
      )}
    </div>
  );
}
