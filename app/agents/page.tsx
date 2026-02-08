'use client';

import { useMemo } from 'react';
import { useAgents, useTasks, useActivity } from '../../lib/convex';
import { Agent, Task, Activity, AgentLevel } from '../../types';

// Helper function to format relative time
function formatRelativeTime(timestamp: any): string {
  const now = Date.now();
  const then = typeof timestamp === 'number' ? timestamp : (timestamp?.toMillis ? timestamp.toMillis() : 0);
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
  const then = typeof lastHeartbeat === 'number' ? lastHeartbeat : (lastHeartbeat?.toMillis ? lastHeartbeat.toMillis() : 0);
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
      textColor: 'text-[#666]',
      dotColor: 'bg-[#555]',
      borderColor: 'border-[#333]'
    };
  }

  switch (agent.status) {
    case 'active':
      return {
        color: 'bg-green-500/10',
        label: 'active',
        textColor: 'text-green-400',
        dotColor: 'bg-green-500',
        borderColor: 'border-green-500/30'
      };
    case 'blocked':
      return {
        color: 'bg-red-500/10',
        label: 'blocked',
        textColor: 'text-red-400',
        dotColor: 'bg-red-500',
        borderColor: 'border-red-500/30'
      };
    case 'idle':
    default:
      return {
        color: 'bg-amber-500/10',
        label: 'idle',
        textColor: 'text-amber-400',
        dotColor: 'bg-amber-500',
        borderColor: 'border-amber-500/30'
      };
  }
}

// Get level badge styles
function getLevelStyles(level: AgentLevel) {
  switch (level) {
    case 'lead':
      return {
        bg: 'bg-[#d4a574]/20',
        text: 'text-[#d4a574]',
        border: 'border-[#d4a574]/40',
        icon: '👑'
      };
    case 'specialist':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        icon: '⚡'
      };
    case 'intern':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        icon: '🌱'
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        icon: '○'
      };
  }
}

// Get agent workload stats
function getAgentWorkload(agentId: string, tasks: Task[]) {
  const assigned = tasks.filter(t => 
    t.assigneeIds.includes(agentId) && 
    (t.status === 'assigned' || t.status === 'in_progress')
  );
  
  const inProgress = assigned.filter(t => t.status === 'in_progress');
  
  return {
    total: assigned.length,
    inProgress: inProgress.length,
    assigned: assigned.filter(t => t.status === 'assigned').length
  };
}

// Get recent status changes for an agent
function getStatusHistory(agentId: string, activities: Activity[]): Activity[] {
  return activities
    .filter(a => 
      a.agentId === agentId && 
      a.type === 'agent_status_changed'
    )
    .slice(0, 5); // Last 5 status changes
}

// Generate 24-hour heartbeat timeline data
function getHeartbeatTimeline(agent: Agent, activities: Activity[]) {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  // Get all agent activities in last 24h as heartbeat indicators
  const getMs = (ts: any) => typeof ts === 'number' ? ts : (ts?.toMillis ? ts.toMillis() : 0);
  const recentActivities = activities
    .filter(a => 
      a.agentId === agent.id && 
      getMs(a.createdAt) > oneDayAgo
    )
    .sort((a, b) => getMs(a.createdAt) - getMs(b.createdAt));
  
  // Divide 24h into 24 hourly segments
  const segments: Array<{ active: boolean; count: number }> = [];
  for (let i = 0; i < 24; i++) {
    const segmentStart = oneDayAgo + (i * 60 * 60 * 1000);
    const segmentEnd = segmentStart + 60 * 60 * 1000;
    
    const activitiesInSegment = recentActivities.filter(a => {
      const time = getMs(a.createdAt);
      return time >= segmentStart && time < segmentEnd;
    });
    
    segments.push({
      active: activitiesInSegment.length > 0,
      count: activitiesInSegment.length
    });
  }
  
  return segments;
}

interface AgentDetailCardProps {
  agent: Agent;
  tasks: Task[];
  activities: Activity[];
}

function AgentDetailCard({ agent, tasks, activities }: AgentDetailCardProps) {
  const statusDisplay = getStatusDisplay(agent);
  const levelStyles = getLevelStyles(agent.level);
  const workload = getAgentWorkload(agent.id, tasks);
  const statusHistory = getStatusHistory(agent.id, activities);
  const heartbeatTimeline = getHeartbeatTimeline(agent, activities);
  
  const currentTask = useMemo(() => {
    if (!agent.currentTaskId) return null;
    return tasks.find(t => t.id === agent.currentTaskId);
  }, [agent.currentTaskId, tasks]);

  // Format session key for display (truncate if too long)
  const displaySessionKey = agent.sessionKey.length > 30 
    ? `${agent.sessionKey.slice(0, 15)}...${agent.sessionKey.slice(-10)}`
    : agent.sessionKey;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#d4a574]/40 transition-all card-hover group">
      {/* Header: Emoji, Name, Status */}
      <div className="flex items-start gap-4 mb-5">
        <div className="text-5xl leading-none group-hover:scale-110 transition-transform duration-300">
          {agent.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-[#ededed] mb-1 truncate">
                {agent.name}
              </h3>
            </div>
            
            {/* Status Badge */}
            <div className={`px-3 py-1.5 rounded-full ${statusDisplay.color} border ${statusDisplay.borderColor} flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${statusDisplay.dotColor} ${agent.status === 'active' && !isOffline(agent.lastHeartbeat) ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-medium uppercase tracking-wide ${statusDisplay.textColor}`}>
                {statusDisplay.label}
              </span>
            </div>
          </div>
          
          {/* Role Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-[#888]">{agent.role}</span>
          </div>
          
          {/* Level Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${levelStyles.bg} border ${levelStyles.border}`}>
            <span className="text-sm">{levelStyles.icon}</span>
            <span className={`text-xs font-medium uppercase tracking-wide ${levelStyles.text}`}>
              {agent.level}
            </span>
          </div>
        </div>
      </div>

      {/* Current Task */}
      {currentTask ? (
        <div className="mb-5 p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574] animate-pulse" />
            <div className="text-xs text-[#d4a574] uppercase tracking-wide font-medium">
              Current Task
            </div>
          </div>
          <p className="text-sm text-[#ededed] font-medium mb-1 line-clamp-1">{currentTask.title}</p>
          <p className="text-xs text-[#666] line-clamp-2">{currentTask.description}</p>
        </div>
      ) : (
        <div className="mb-5 p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#444]" />
            <div className="text-xs text-[#555] uppercase tracking-wide font-medium">
              No Active Task
            </div>
          </div>
          <p className="text-sm text-[#555] italic">Waiting for assignment...</p>
        </div>
      )}

      {/* Session Key */}
      <div className="mb-5 p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
        <div className="text-[10px] text-[#555] uppercase tracking-wide mb-1.5">Session Key</div>
        <code className="text-xs text-[#888] font-mono break-all">{displaySessionKey}</code>
      </div>

      {/* Workload Stats */}
      <div className="mb-5 pb-5 border-b border-[#2a2a2a]">
        <div className="text-xs text-[#666] uppercase tracking-wide mb-3">Workload</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-2 bg-[#0f0f0f] rounded-lg">
            <div className="text-xl font-bold text-[#ededed] mb-0.5">{workload.total}</div>
            <div className="text-[10px] text-[#666] uppercase tracking-wide">Total</div>
          </div>
          <div className="text-center p-2 bg-[#0f0f0f] rounded-lg">
            <div className="text-xl font-bold text-[#d4a574] mb-0.5">{workload.inProgress}</div>
            <div className="text-[10px] text-[#666] uppercase tracking-wide">Active</div>
          </div>
          <div className="text-center p-2 bg-[#0f0f0f] rounded-lg">
            <div className="text-xl font-bold text-[#666] mb-0.5">{workload.assigned}</div>
            <div className="text-[10px] text-[#666] uppercase tracking-wide">Queued</div>
          </div>
        </div>
      </div>

      {/* Last Heartbeat with Status Indicator */}
      <div className="mb-5 pb-5 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-[#666] uppercase tracking-wide">Last Heartbeat</div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isOffline(agent.lastHeartbeat) ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOffline(agent.lastHeartbeat) ? 'bg-red-500' : 'bg-green-500'} ${!isOffline(agent.lastHeartbeat) ? 'animate-pulse' : ''}`} />
            <span className={`text-[10px] font-medium uppercase ${isOffline(agent.lastHeartbeat) ? 'text-red-400' : 'text-green-400'}`}>
              {isOffline(agent.lastHeartbeat) ? 'Stale' : 'Live'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#888] font-mono">{formatRelativeTime(agent.lastHeartbeat)}</span>
          <span className="text-[10px] text-[#555]">
            {new Date(typeof agent.lastHeartbeat === 'number' ? agent.lastHeartbeat : (agent.lastHeartbeat?.toMillis ? agent.lastHeartbeat.toMillis() : 0)).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Status History */}
      {statusHistory.length > 0 && (
        <div className="mb-5 pb-5 border-b border-[#2a2a2a]">
          <div className="text-xs text-[#666] uppercase tracking-wide mb-3">Recent Activity</div>
          <div className="space-y-2">
            {statusHistory.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between text-xs">
                <span className="text-[#aaa] line-clamp-1 flex-1 min-w-0 mr-3">
                  {activity.message}
                </span>
                <span className="text-[#666] font-mono whitespace-nowrap text-[10px]">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heartbeat Timeline (Last 24h) */}
      <div>
        <div className="text-xs text-[#666] uppercase tracking-wide mb-3">
          Activity Timeline (24h)
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {heartbeatTimeline.map((segment, index) => {
            const height = segment.active ? Math.min(100, 20 + segment.count * 15) : 8;
            const bgColor = segment.active ? 'bg-[#d4a574]' : 'bg-[#2a2a2a]';
            
            return (
              <div
                key={index}
                className={`flex-1 ${bgColor} rounded-sm transition-all hover:opacity-80`}
                style={{ height: `${height}%` }}
                title={`${24 - index}h ago: ${segment.count} activities`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-[#555] mt-2">
          <span>24h ago</span>
          <span>12h ago</span>
          <span>now</span>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const { agents, loading: agentsLoading, error: agentsError } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { activities, loading: activitiesLoading } = useActivity();

  const loading = agentsLoading || tasksLoading || activitiesLoading;

  // Sort agents: active first, then by name
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const aOffline = isOffline(a.lastHeartbeat);
      const bOffline = isOffline(b.lastHeartbeat);
      
      // Online agents first
      if (aOffline && !bOffline) return 1;
      if (!aOffline && bOffline) return -1;
      
      // Then sort by status (active > idle > blocked)
      const statusOrder = { active: 0, idle: 1, blocked: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // Finally by name
      return a.name.localeCompare(b.name);
    });
  }, [agents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-[#666]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4a574] mx-auto mb-4"></div>
              <p>Loading agents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (agentsError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Agents</h2>
            <p className="text-sm text-[#888]">{agentsError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[#ededed] mb-8">🤖 Agents</h1>
          
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">👻</div>
            <h2 className="text-2xl font-semibold text-[#ededed] mb-2">No Agents Yet</h2>
            <p className="text-[#888]">
              Agents will appear here once they're registered in the system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = sortedAgents.filter(a => !isOffline(a.lastHeartbeat) && a.status === 'active').length;
  const onlineCount = sortedAgents.filter(a => !isOffline(a.lastHeartbeat)).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#ededed] mb-3">🤖 Agents</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[#888]">
                <span className="text-[#ededed] font-medium">{activeCount}</span> active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#d4a574]"></div>
              <span className="text-[#888]">
                <span className="text-[#ededed] font-medium">{onlineCount}</span> online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#555]"></div>
              <span className="text-[#888]">
                <span className="text-[#ededed] font-medium">{sortedAgents.length - onlineCount}</span> offline
              </span>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedAgents.map((agent) => (
            <AgentDetailCard
              key={agent.id}
              agent={agent}
              tasks={tasks}
              activities={activities}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
