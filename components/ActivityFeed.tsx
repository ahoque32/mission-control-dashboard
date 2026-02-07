'use client';

import { useEffect, useRef } from 'react';
import { useActivity, useAgents } from '../lib/firebase';
import { Activity, ActivityType } from '../types';
import { Timestamp } from 'firebase/firestore';

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

// Helper to format duration in milliseconds to human-readable
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

// Activity type styling configuration
interface ActivityStyle {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

function getActivityStyle(type: ActivityType): ActivityStyle {
  switch (type) {
    // Agent task lifecycle - success states
    case 'agent_task_completed':
      return {
        icon: '✅',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/20',
      };
    case 'agent_run_completed':
      return {
        icon: '🏁',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/20',
      };
    
    // Agent task lifecycle - in progress states
    case 'agent_task_started':
      return {
        icon: '🚀',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
      };
    case 'agent_run_started':
      return {
        icon: '▶️',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
      };
    
    // Agent task lifecycle - failure states
    case 'agent_task_failed':
      return {
        icon: '❌',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/20',
      };
    
    // Session events
    case 'session_created':
      return {
        icon: '🔗',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/20',
      };
    case 'session_state_changed':
      return {
        icon: '🔄',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/20',
      };
    
    // Default styling for other types
    default:
      return {
        icon: '📝',
        bgColor: 'bg-[#d4a574]/10',
        textColor: 'text-[#d4a574]',
        borderColor: 'border-[#d4a574]/20',
      };
  }
}

export default function ActivityFeed() {
  const { activities, loading, error } = useActivity();
  const { agents } = useAgents();
  const feedEndRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef<number>(0);

  // Create a map of agent IDs to agent data for quick lookup
  // Map by: Firebase doc ID, name (lowercase), and sessionKey
  const agentMap = agents.reduce((map, agent) => {
    map[agent.id] = agent;
    if (agent.name) {
      map[agent.name.toLowerCase()] = agent;
      map[agent.name] = agent;
    }
    if (agent.sessionKey) {
      // Map by full sessionKey and by the agent name part (e.g., "jhawk-sys" from "agent:jhawk-sys:main")
      map[agent.sessionKey] = agent;
      const match = agent.sessionKey.match(/^agent:([^:]+):/);
      if (match) map[match[1]] = agent;
    }
    return map;
  }, {} as Record<string, typeof agents[0]>);

  // Auto-scroll to newest activity when new items arrive
  useEffect(() => {
    if (activities.length > previousCountRef.current && previousCountRef.current > 0) {
      // New activity arrived - scroll to top (since activities are desc order)
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    previousCountRef.current = activities.length;
  }, [activities.length]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading activity">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-[#888]">Loading activity...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-red-400 mb-1">Failed to load activity</p>
          <p className="text-xs text-[#666]">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-[#888] mb-1">No activity yet</p>
          <p className="text-xs text-[#666]">Activity will appear here as agents work</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="feed" aria-label="Activity feed" aria-busy={loading}>
      {/* Scroll anchor at top */}
      <div ref={feedEndRef} />

      {activities.map((activity) => {
        const agent = agentMap[activity.agentId];
        const agentEmoji = agent?.emoji || '🤖';
        const agentName = agent?.name || 'Unknown Agent';
        const style = getActivityStyle(activity.type);
        
        // Extract metadata for display
        const metadata = activity.metadata || {};
        const duration = metadata.duration as number | undefined;
        const taskName = metadata.taskName as string | undefined;
        const errorSummary = metadata.errorSummary as string | undefined;
        const iterationCount = metadata.iterationCount as number | undefined;
        const displayAgentName = metadata.agentName as string | undefined;

        return (
          <article
            key={activity.id}
            role="article"
            aria-label={`Activity by ${agentName}: ${activity.message}`}
            className="
              bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4
              hover:border-[#d4a574]/30 transition-all
              flex items-start gap-3
            "
          >
            {/* Agent Avatar */}
            <div className="
              w-10 h-10 rounded-full 
              bg-[#0a0a0a] border border-[#2a2a2a]
              flex items-center justify-center
              flex-shrink-0
              text-xl
            ">
              {agentEmoji}
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              {/* Agent name and timestamp */}
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-[#ededed]">
                  {displayAgentName || agentName}
                </span>
                <span className="text-xs text-[#666] font-mono whitespace-nowrap">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>

              {/* Activity message */}
              <p className="text-sm text-[#aaa] leading-relaxed">
                {activity.message}
              </p>

              {/* Task name if present */}
              {taskName && (
                <p className="text-xs text-[#666] mt-1 italic">
                  Task: {taskName}
                </p>
              )}

              {/* Error summary for failed tasks */}
              {errorSummary && (
                <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-xs text-red-400">
                  {errorSummary}
                </div>
              )}

              {/* Metadata badges row */}
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Activity type badge with styling */}
                <span className={`
                  inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded
                  ${style.bgColor} ${style.textColor} border ${style.borderColor}
                `}>
                  <span>{style.icon}</span>
                  {activity.type.replace(/_/g, ' ')}
                </span>

                {/* Duration badge */}
                {duration !== undefined && duration > 0 && (
                  <span className="
                    inline-block text-xs px-2 py-0.5 rounded
                    bg-[#333] text-[#888] border border-[#444]
                  ">
                    ⏱️ {formatDuration(duration)}
                  </span>
                )}

                {/* Iteration count badge */}
                {iterationCount !== undefined && (
                  <span className="
                    inline-block text-xs px-2 py-0.5 rounded
                    bg-[#333] text-[#888] border border-[#444]
                  ">
                    #️⃣ Run {iterationCount}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
