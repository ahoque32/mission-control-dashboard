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
  provider: string;
  role: string;
  level: string;
}

// ═══════════════════════════════════════════════════════
// Active Agent Squad (7 Agents)
// ═══════════════════════════════════════════════════════
export const AGENTS: Agent[] = [
  {
    id: 'anton',
    name: 'Anton',
    description: 'Primary assistant — general purpose, strategic thinking, orchestration',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/20',
    emoji: '🤖',
    model: 'Claude Opus 4.6',
    provider: 'anthropic',
    role: 'Commander',
    level: 'commander',
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Deputy (GPT) — coding, analysis, research',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/20',
    emoji: '🪞',
    model: 'GPT-5.3 Codex',
    provider: 'openai',
    role: 'Deputy (GPT)',
    level: 'lead',
  },
  {
    id: 'drago',
    name: 'Drago',
    description: 'Deputy (Gemini) — coding, multimodal, research',
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/20',
    emoji: '🐉',
    model: 'Gemini 3 Pro',
    provider: 'google',
    role: 'Deputy (Gemini)',
    level: 'lead',
  },
  {
    id: 'dante',
    name: 'Dante',
    description: 'Developer — coding, refactoring, implementation',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/20',
    emoji: '🔥',
    model: 'Kimi K2.5',
    provider: 'moonshot',
    role: 'Developer',
    level: 'specialist',
  },
  {
    id: 'vincent',
    name: 'Vincent',
    description: 'Utility — design, UI/UX, content',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/15',
    borderColor: 'border-pink-500/20',
    emoji: '🎨',
    model: 'MiniMax M2.5',
    provider: 'minimax',
    role: 'Utility',
    level: 'specialist',
  },
  {
    id: 'hunter',
    name: 'Hunter',
    description: 'Sales/Outbound — sales, outreach, communication',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/20',
    emoji: '🎯',
    model: 'MiniMax M2.5',
    provider: 'minimax',
    role: 'Sales/Outbound',
    level: 'specialist',
  },
  {
    id: 'maestro',
    name: 'Maestro',
    description: 'Orchestrator — workflow, coordination, system integration',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/20',
    emoji: '🎼',
    model: 'Kimi K2.5',
    provider: 'moonshot',
    role: 'Orchestrator',
    level: 'lead',
  },
];

export const ALLOWED_AGENT_IDS = AGENTS.map(a => a.id);

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id);
}
