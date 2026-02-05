'use client';

import { useEffect, useRef } from 'react';
import { useActivity, useAgents } from '../lib/firebase';
import { Activity } from '../types';
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

export default function ActivityFeed() {
  const { activities, loading, error } = useActivity();
  const { agents } = useAgents();
  const feedEndRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef<number>(0);

  // Create a map of agent IDs to agent data for quick lookup
  const agentMap = agents.reduce((map, agent) => {
    map[agent.id] = agent;
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
    <div className="space-y-3">
      {/* Scroll anchor at top */}
      <div ref={feedEndRef} />

      {activities.map((activity) => {
        const agent = agentMap[activity.agentId];
        const agentEmoji = agent?.emoji || '🤖';
        const agentName = agent?.name || 'Unknown Agent';

        return (
          <div
            key={activity.id}
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
                  {agentName}
                </span>
                <span className="text-xs text-[#666] font-mono whitespace-nowrap">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>

              {/* Activity message */}
              <p className="text-sm text-[#aaa] leading-relaxed">
                {activity.message}
              </p>

              {/* Activity type badge */}
              <div className="mt-2">
                <span className="
                  inline-block text-xs px-2 py-0.5 rounded
                  bg-[#d4a574]/10 text-[#d4a574]
                  border border-[#d4a574]/20
                ">
                  {activity.type.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
