'use client';

import { useState, useEffect } from 'react';
import { Agent, Activity } from '../types';
import { Timestamp } from 'firebase/firestore';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
      color: 'bg-gray-500',
      label: 'offline',
      textColor: 'text-gray-400'
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
        label: 'error',
        textColor: 'text-red-400'
      };
    case 'idle':
    default:
      return {
        color: 'bg-yellow-500',
        label: 'idle',
        textColor: 'text-yellow-400'
      };
  }
}

export default function AgentCard({ agent, currentTask }: AgentCardProps) {
  const statusDisplay = getStatusDisplay(agent);
  const [recentActivity, setRecentActivity] = useState<Activity | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<Error | null>(null);

  // Subscribe to recent activities for this agent
  useEffect(() => {
    // Reset states on agent change
    setActivityLoading(true);
    setActivityError(null);
    
    // Query for agent's most recent activity in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const q = query(
      collection(db, 'activities'),
      where('agentId', '==', agent.id),
      where('createdAt', '>=', Timestamp.fromDate(fiveMinutesAgo)),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        if (!snapshot.empty) {
          const activity = snapshot.docs[0].data() as Activity;
          activity.id = snapshot.docs[0].id;
          setRecentActivity(activity);
          setIsActive(true);
        } else {
          setRecentActivity(null);
          setIsActive(false);
        }
        setActivityLoading(false);
        setActivityError(null);
      },
      (error) => {
        console.error(`Error subscribing to activities for agent ${agent.id}:`, error);
        setActivityError(error as Error);
        setActivityLoading(false);
        setRecentActivity(null);
        setIsActive(false);
      }
    );

    return () => unsubscribe();
  }, [agent.id]);

  // Get task name from recent activity for tooltip
  const activeTaskName = recentActivity?.metadata?.taskName as string | undefined;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 hover:border-[#d4a574]/30 transition-all card-hover">
      {/* Header: Emoji + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl leading-none">{agent.emoji}</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color}`} />
            {/* Pulsing active indicator */}
            {isActive && (
              <div 
                className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-75"
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
