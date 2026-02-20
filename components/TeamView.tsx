'use client';

import { useAgents, useAgentState } from '../lib/convex';
import Icon from './ui/Icon';

// Agent hierarchy definition
const AGENT_HIERARCHY = {
  ahawk: {
    name: 'Ahawk',
    emoji: '🦅',
    role: 'Overseer',
    model: 'Claude 3.5 Sonnet',
    description: 'System architect and final decision maker',
    reportsTo: null,
    color: '#ef4444',
  },
  anton: {
    name: 'Anton',
    emoji: '🤖',
    role: 'Coordinator',
    model: 'Kimi K2.5',
    description: 'Main agent coordinator and task dispatcher',
    reportsTo: 'ahawk',
    color: '#3b82f6',
  },
  dante: {
    name: 'Dante',
    emoji: '🔥',
    role: 'Executor',
    model: 'Kimi K2.5',
    description: 'Task execution and implementation specialist',
    reportsTo: 'anton',
    color: '#8b5cf6',
  },
  vincent: {
    name: 'Vincent',
    emoji: '🎨',
    role: 'Creative',
    model: 'Kimi K2.5',
    description: 'Creative content and design specialist',
    reportsTo: 'anton',
    color: '#f59e0b',
  },
};

type AgentStatus = 'online' | 'busy' | 'offline' | 'active' | 'idle' | 'error';

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; icon: string }> = {
  online: { label: 'Online', color: '#10b981', icon: 'circle-fill' },
  active: { label: 'Active', color: '#10b981', icon: 'circle-fill' },
  busy: { label: 'Busy', color: '#f59e0b', icon: 'circle-fill' },
  idle: { label: 'Idle', color: '#6b7280', icon: 'circle' },
  offline: { label: 'Offline', color: '#ef4444', icon: 'circle' },
  error: { label: 'Error', color: '#ef4444', icon: 'exclamation-circle' },
};

export default function TeamView() {
  const { agents, loading } = useAgents();

  // Map agents to hierarchy
  const teamMembers = Object.entries(AGENT_HIERARCHY).map(([id, config]) => {
    const agent = agents.find(a => a.name.toLowerCase() === id);
    const status = (agent?.status || 'offline') as AgentStatus;
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
    
    return {
      id,
      ...config,
      status,
      statusConfig,
      currentTask: agent?.currentTaskId,
      lastHeartbeat: agent?.lastHeartbeat,
      isOnline: status === 'online' || status === 'active' || status === 'busy',
    };
  });

  // Build hierarchy tree
  const hierarchy = buildHierarchy(teamMembers);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-foreground-secondary">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hierarchy Tree */}
      <div className="flex justify-center">
        <div className="space-y-8">
          {hierarchy.map(level => renderLevel(level, 0))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Online"
          value={teamMembers.filter(m => m.isOnline).length}
          total={teamMembers.length}
          color="#10b981"
        />
        <StatCard
          label="Busy"
          value={teamMembers.filter(m => m.status === 'busy').length}
          total={teamMembers.length}
          color="#f59e0b"
        />
        <StatCard
          label="Idle"
          value={teamMembers.filter(m => m.status === 'idle').length}
          total={teamMembers.length}
          color="#6b7280"
        />
        <StatCard
          label="Offline"
          value={teamMembers.filter(m => m.status === 'offline' || m.status === 'error').length}
          total={teamMembers.length}
          color="#ef4444"
        />
      </div>
    </div>
  );
}

function buildHierarchy(members: any[]) {
  const levels: any[][] = [];
  
  // Find root (no reportsTo)
  const root = members.filter(m => !m.reportsTo);
  if (root.length > 0) levels.push(root);
  
  // Build levels
  let currentLevel = root.map(m => m.id);
  while (currentLevel.length > 0) {
    const nextLevel = members.filter(m => currentLevel.includes(m.reportsTo));
    if (nextLevel.length > 0) {
      levels.push(nextLevel);
      currentLevel = nextLevel.map(m => m.id);
    } else {
      break;
    }
  }
  
  return levels;
}

function renderLevel(members: any[], depth: number) {
  return (
    <div key={depth} className="flex justify-center gap-8">
      {members.map(member => (
        <AgentCard key={member.id} agent={member} />
      ))}
    </div>
  );
}

function AgentCard({ agent }: { agent: any }) {
  return (
    <div className="glass-card p-5 rounded-xl w-64 hover:border-emerald-500/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${agent.color}20` }}
          >
            {agent.emoji}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{agent.name}</h3>
            <p className="text-xs text-foreground-secondary">{agent.role}</p>
          </div>
        </div>
        
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${agent.statusConfig.color}20`,
            color: agent.statusConfig.color 
          }}
        >
          <Icon name={agent.statusConfig.icon} size={10} />
          {agent.statusConfig.label}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Icon name="cpu" size={14} />
          <span>{agent.model}</span>
        </div>
        
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Icon name="info-circle" size={14} />
          <span className="line-clamp-1">{agent.description}</span>
        </div>
        
        {agent.currentTask && (
          <div className="flex items-center gap-2 text-emerald-400">
            <Icon name="kanban" size={14} />
            <span className="line-clamp-1">Working on task</span>
          </div>
        )}
        
        {agent.lastHeartbeat && (
          <div className="flex items-center gap-2 text-foreground-muted text-xs">
            <Icon name="clock" size={12} />
            <span>Last seen: {formatTimeAgo(agent.lastHeartbeat)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-border flex gap-2">
        <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors">
          View Activity
        </button>
        <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors">
          Assign Task
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-foreground-secondary">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground" style={{ color }}>{value}</span>
        <span className="text-sm text-foreground-muted">/ {total}</span>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
