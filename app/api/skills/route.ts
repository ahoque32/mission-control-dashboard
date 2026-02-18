import { NextResponse } from 'next/server';

export interface Skill {
  name: string;
  description: string;
  category: string;
  emoji: string;
  source: 'system' | 'agent';
}

const skills: Skill[] = [
  // Communication & Messaging
  { name: 'AgentMail', description: 'API-first email platform for AI agents. Create inboxes, send and receive emails programmatically, and handle email-based workflows.', category: 'Communication', emoji: '📧', source: 'agent' },
  { name: 'iMessage', description: 'iMessage/SMS CLI for listing chats, viewing history, and sending messages via Messages.app.', category: 'Communication', emoji: '💬', source: 'system' },
  { name: 'Slack', description: 'Control Slack from OpenClaw — send messages, react to messages, pin/unpin items in channels or DMs.', category: 'Communication', emoji: '💼', source: 'system' },
  { name: 'Discord', description: 'Discord operations via the message tool for server and channel management.', category: 'Communication', emoji: '🎮', source: 'system' },

  // LinkedIn
  { name: 'LinkedIn', description: 'LinkedIn automation via browser relay or cookies for messaging, profile viewing, and network actions.', category: 'LinkedIn', emoji: '🔗', source: 'agent' },
  { name: 'LinkedIn Autopilot', description: 'Auto-build LinkedIn presence — schedule posts, auto-engage targets, run personalized DM sequences, and connection campaigns with human-like behavior.', category: 'LinkedIn', emoji: '🤖', source: 'agent' },

  // Development & Code
  { name: 'Coding Agent', description: 'Delegate coding tasks to Codex, Claude Code, or Pi agents via background processes. Build features, review PRs, refactor codebases.', category: 'Development', emoji: '🧩', source: 'system' },
  { name: 'GitHub', description: 'GitHub operations via gh CLI — issues, PRs, CI runs, code review, and API queries.', category: 'Development', emoji: '🐙', source: 'system' },
  { name: 'GH Issues', description: 'Fetch GitHub issues, spawn sub-agents to implement fixes and open PRs, then monitor and address review comments.', category: 'Development', emoji: '🔧', source: 'system' },
  { name: 'MCP Porter', description: 'List, configure, auth, and call MCP servers and tools directly — HTTP or stdio, including ad-hoc servers and CLI generation.', category: 'Development', emoji: '🔌', source: 'system' },

  // Research & Search
  { name: 'X Research', description: 'Search X/Twitter for real-time perspectives, dev discussions, product feedback, breaking news, and expert opinions.', category: 'Research', emoji: '🔍', source: 'agent' },
  { name: 'ClawHub', description: 'Search, install, update, and publish agent skills from the ClawHub marketplace.', category: 'Research', emoji: '📦', source: 'system' },
  { name: 'Summarize', description: 'Summarize or extract text and transcripts from URLs, podcasts, YouTube videos, and local files.', category: 'Research', emoji: '📝', source: 'system' },
  { name: 'Blog Watcher', description: 'Monitor blogs and RSS/Atom feeds for updates and new content.', category: 'Research', emoji: '📡', source: 'system' },

  // Productivity
  { name: 'Google Workspace', description: 'CLI for Gmail, Calendar, Drive, Contacts, Sheets, and Docs — full Google Workspace integration.', category: 'Productivity', emoji: '📊', source: 'agent' },
  { name: 'Apple Notes', description: 'Manage Apple Notes via memo CLI — create, view, edit, delete, search, move, and export notes.', category: 'Productivity', emoji: '🍎', source: 'system' },
  { name: 'Things 3', description: 'Manage Things 3 tasks via CLI — add/update projects and todos, list inbox/today/upcoming, search tasks.', category: 'Productivity', emoji: '✅', source: 'system' },
  { name: 'Automation Workflows', description: 'Design and implement no-code automation workflows with Zapier, Make, or n8n to save time and scale operations.', category: 'Productivity', emoji: '⚡', source: 'agent' },

  // AI & Models
  { name: 'Gemini', description: 'Gemini CLI for one-shot Q&A, summaries, and content generation powered by Google AI.', category: 'AI & Models', emoji: '✨', source: 'system' },
  { name: 'OpenAI Whisper', description: 'Local speech-to-text transcription with the Whisper CLI — no API key needed.', category: 'AI & Models', emoji: '🎤', source: 'system' },

  // Media
  { name: 'Video Frames', description: 'Extract frames or short clips from videos using ffmpeg for analysis or content creation.', category: 'Media', emoji: '🎬', source: 'system' },

  // Infrastructure & Security
  { name: 'Health Check', description: 'Host security hardening and risk-tolerance configuration — firewall, SSH, updates, and periodic security audits.', category: 'Infrastructure', emoji: '🛡️', source: 'system' },
  { name: 'Weather', description: 'Current weather and forecasts via wttr.in or Open-Meteo for any location worldwide.', category: 'Infrastructure', emoji: '🌤️', source: 'system' },

  // Skill Management
  { name: 'Skill Creator', description: 'Create or update AgentSkills — design, structure, and package skills with scripts, references, and assets.', category: 'Skill Management', emoji: '🏗️', source: 'system' },
];

export async function GET() {
  const categories = [...new Set(skills.map(s => s.category))];
  return NextResponse.json({
    skills,
    categories,
    total: skills.length,
    categoryCounts: categories.reduce((acc, cat) => {
      acc[cat] = skills.filter(s => s.category === cat).length;
      return acc;
    }, {} as Record<string, number>),
  });
}
