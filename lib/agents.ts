// lib/agents.ts - Agent configuration for the chat interface

export interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  model: string;
}

export const AGENTS: Agent[] = [
  {
    id: 'main',
    name: 'Anton',
    description: 'Primary assistant — general purpose, strategic thinking',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/20',
    emoji: '🧠',
    model: 'Claude Opus 4.6',
  },
  {
    id: 'dante-agent',
    name: 'Dante',
    description: 'Coding & research — fast, technical, precise',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/20',
    emoji: '⚡',
    model: 'Kimi K2.5',
  },
  {
    id: 'dante-fast',
    name: 'Dante (Fast)',
    description: 'Ultra-fast coding mode — quick iterations',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/20',
    emoji: '⚡⚡',
    model: 'Kimi for Coding',
  },
  {
    id: 'vincent-agent',
    name: 'Vincent',
    description: 'Creative & media — artistic, visual, expressive',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/20',
    emoji: '🎨',
    model: 'MiniMax M2.1',
  },
];

export const ALLOWED_AGENT_IDS = AGENTS.map(a => a.id);

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id);
}
