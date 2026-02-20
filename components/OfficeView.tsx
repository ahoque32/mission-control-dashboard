'use client';

import { useState } from 'react';
import { useAgents } from '../lib/convex';
import Icon from './ui/Icon';

// Agent positions in the isometric office
const AGENT_POSITIONS: Record<string, { x: number; y: number; desk: 'left' | 'right' | 'center' }> = {
  ahawk: { x: 50, y: 20, desk: 'center' },    // Top center - overseer
  anton: { x: 30, y: 40, desk: 'left' },      // Left side
  dante: { x: 70, y: 40, desk: 'right' },     // Right side
  vincent: { x: 50, y: 60, desk: 'center' },  // Bottom center
};

const AGENT_CONFIG: Record<string, { emoji: string; color: string; name: string }> = {
  ahawk: { emoji: '🦅', color: '#ef4444', name: 'Ahawk' },
  anton: { emoji: '🤖', color: '#3b82f6', name: 'Anton' },
  dante: { emoji: '🔥', color: '#8b5cf6', name: 'Dante' },
  vincent: { emoji: '🎨', color: '#f59e0b', name: 'Vincent' },
};

type AgentStatus = 'online' | 'busy' | 'offline' | 'active' | 'idle' | 'error';

export default function OfficeView() {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const getAgentStatus = (agentName: string): AgentStatus => {
    const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
    return (agent?.status || 'offline') as AgentStatus;
  };

  const getAgentTask = (agentName: string) => {
    const agent = agents.find(a => a.name.toLowerCase() === agentName.toLowerCase());
    return agent?.currentTaskId;
  };

  const isWorking = (status: AgentStatus) => status === 'online' || status === 'active' || status === 'busy';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-foreground-secondary">Loading office...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Agent Office</h2>
          <p className="text-sm text-foreground-secondary">Real-time view of agent activity</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-foreground-secondary">Working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-sm text-foreground-secondary">Idle</span>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-2xl relative overflow-hidden">
        {/* Isometric Office SVG */}
        <svg 
          viewBox="0 0 100 80" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Floor */}
          <g className="office-floor">
            <polygon 
              points="10,40 50,20 90,40 50,60" 
              fill="rgba(16, 185, 129, 0.05)" 
              stroke="rgba(16, 185, 129, 0.2)" 
              strokeWidth="0.5"
            />
            {/* Grid lines */}
            <line x1="30" y1="30" x2="30" y2="50" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.3"/>
            <line x1="50" y1="20" x2="50" y2="60" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.3"/>
            <line x1="70" y1="30" x2="70" y2="50" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.3"/>
            <line x1="20" y1="35" x2="80" y2="35" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.3"/>
            <line x1="10" y1="40" x2="90" y2="40" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.3"/>
            <line x1="20" y1="45" x2="80" y2="45" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.3"/>
          </g>

          {/* Desks */}
          {Object.entries(AGENT_POSITIONS).map(([agentId, pos]) => (
            <g key={`desk-${agentId}`}>
              <Desk x={pos.x} y={pos.y} type={pos.desk} />
            </g>
          ))}

          {/* Agents */}
          {Object.entries(AGENT_POSITIONS).map(([agentId, pos]) => {
            const status = getAgentStatus(agentId);
            const working = isWorking(status);
            const config = AGENT_CONFIG[agentId];

            return (
              <g 
                key={agentId}
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedAgent(agentId)}
              >
                <AgentAvatar 
                  x={pos.x} 
                  y={pos.y - 8} 
                  emoji={config.emoji}
                  color={config.color}
                  working={working}
                  name={config.name}
                />
              </g>
            );
          })}
        </svg>

        {/* Status Popup */}
        {selectedAgent && (
          <AgentPopup 
            agentId={selectedAgent}
            config={AGENT_CONFIG[selectedAgent]}
            status={getAgentStatus(selectedAgent)}
            currentTask={getAgentTask(selectedAgent)}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </div>
    </div>
  );
}

// Desk Component
function Desk({ x, y, type }: { x: number; y: number; type: 'left' | 'right' | 'center' }) {
  const width = type === 'center' ? 12 : 10;
  const height = 6;
  
  // Isometric desk shape
  const points = `
    ${x - width/2},${y} 
    ${x},${y - height/2} 
    ${x + width/2},${y} 
    ${x},${y + height/2}
  `;

  return (
    <g>
      {/* Desk surface */}
      <polygon 
        points={points}
        fill="rgba(255, 255, 255, 0.08)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.3"
      />
      {/* Monitor */}
      <rect 
        x={x - 2} 
        y={y - 4} 
        width="4" 
        height="3" 
        fill="rgba(16, 185, 129, 0.3)"
        rx="0.5"
      />
      {/* Monitor glow */}
      <rect 
        x={x - 1.8} 
        y={y - 3.8} 
        width="3.6" 
        height="2.6" 
        fill="rgba(16, 185, 129, 0.1)"
        rx="0.3"
      />
    </g>
  );
}

// Agent Avatar Component
function AgentAvatar({ 
  x, 
  y, 
  emoji, 
  color, 
  working,
  name 
}: { 
  x: number; 
  y: number; 
  emoji: string; 
  color: string;
  working: boolean;
  name: string;
}) {
  return (
    <g>
      {/* Status ring */}
      <circle 
        cx={x} 
        cy={y} 
        r="5" 
        fill="none"
        stroke={working ? color : '#6b7280'}
        strokeWidth="0.5"
        opacity={working ? 1 : 0.5}
      >
        {working && (
          <animate 
            attributeName="r" 
            values="5;6;5" 
            dur="2s" 
            repeatCount="indefinite" 
          />
        )}
      </circle>
      
      {/* Avatar background */}
      <circle 
        cx={x} 
        cy={y} 
        r="4" 
        fill={`${color}30`}
        stroke={color}
        strokeWidth="0.3"
      />
      
      {/* Emoji */}
      <text 
        x={x} 
        y={y + 1.5} 
        textAnchor="middle" 
        fontSize="4"
        className="select-none"
      >
        {emoji}
      </text>

      {/* Working indicator */}
      {working && (
        <g>
          <circle cx={x + 3} cy={y - 3} r="1.5" fill="#10b981">
            <animate 
              attributeName="opacity" 
              values="1;0.3;1" 
              dur="1.5s" 
              repeatCount="indefinite" 
            />
          </circle>
        </g>
      )}

      {/* Name label */}
      <text 
        x={x} 
        y={y + 8} 
        textAnchor="middle" 
        fontSize="2"
        fill="rgba(255,255,255,0.7)"
        className="select-none"
      >
        {name}
      </text>
    </g>
  );
}

// Agent Popup Component
function AgentPopup({ 
  agentId, 
  config, 
  status, 
  currentTask,
  onClose 
}: { 
  agentId: string;
  config: { emoji: string; color: string; name: string };
  status: AgentStatus;
  currentTask?: string | null;
  onClose: () => void;
}) {
  const statusLabels: Record<AgentStatus, string> = {
    online: 'Online',
    active: 'Active',
    busy: 'Busy',
    idle: 'Idle',
    offline: 'Offline',
    error: 'Error',
  };

  const statusColors: Record<AgentStatus, string> = {
    online: '#10b981',
    active: '#10b981',
    busy: '#f59e0b',
    idle: '#6b7280',
    offline: '#ef4444',
    error: '#ef4444',
  };

  return (
    <>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card p-4 rounded-xl min-w-[280px]">
        <div className="flex items-start gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${config.color}20` }}
          >
            {config.emoji}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">{config.name}</h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
                <Icon name="x-lg" size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statusColors[status] }}
              />
              <span className="text-sm text-foreground-secondary">{statusLabels[status]}</span>
            </div>

            {currentTask && (
              <div className="mt-2 text-sm">
                <span className="text-foreground-muted">Current task: </span>
                <span className="text-emerald-400">Active</span>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors">
                View Profile
              </button>
              <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors">
                Assign Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
