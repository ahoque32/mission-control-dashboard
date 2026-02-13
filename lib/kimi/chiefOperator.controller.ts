/**
 * Kimi Portal — Chief Operator Controller
 *
 * Core logic for profile loading, memory management,
 * escalation detection, and handoff packet generation.
 */

import { FALLBACK_JHAWK_PROFILE } from './kimi.config';
import {
  FINANCIAL_KEYWORDS,
  INFRASTRUCTURE_KEYWORDS,
  SECURITY_KEYWORDS,
  CROSS_AGENT_KEYWORDS,
} from './kimi.config';
import type {
  JHawkProfile,
  KimiMode,
  EscalationTrigger,
  EscalationSeverity,
  HandoffPacket,
} from './kimi.types';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// ── Profile Loading ─────────────────────────────────────────────────────────

/**
 * Fetch the JHawk Profile from Convex.
 * Falls back to FALLBACK_JHAWK_PROFILE on error.
 */
export async function loadJHawkProfile(): Promise<JHawkProfile> {
  if (!CONVEX_URL) {
    console.warn('[Kimi] No CONVEX_URL set, using fallback profile');
    return FALLBACK_JHAWK_PROFILE;
  }

  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'agentProfiles:getByProfileId',
        args: { profileId: 'jhawk_profile' },
        format: 'json',
      }),
    });

    if (!res.ok) {
      console.error(`[Kimi] Convex profile fetch failed: ${res.status}`);
      return FALLBACK_JHAWK_PROFILE;
    }

    const data = await res.json();
    const profile = data.value;

    if (!profile) {
      console.warn('[Kimi] JHawk profile not found in Convex, using fallback');
      return FALLBACK_JHAWK_PROFILE;
    }

    return profile as JHawkProfile;
  } catch (error) {
    console.error('[Kimi] Failed to load JHawk profile:', error);
    return FALLBACK_JHAWK_PROFILE;
  }
}

// ── Memory Loading ──────────────────────────────────────────────────────────

interface KimiMemoryEntry {
  key: string;
  value: string;
  category: string;
}

/**
 * Fetch active Kimi memory entries from Convex.
 * Returns empty array on error.
 */
export async function loadKimiMemory(): Promise<KimiMemoryEntry[]> {
  if (!CONVEX_URL) return [];

  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'kimiMemory:getActive',
        args: {},
        format: 'json',
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const entries = data.value;

    if (!Array.isArray(entries)) return [];

    return entries.map((e: Record<string, unknown>) => ({
      key: String(e.key || ''),
      value: String(e.value || ''),
      category: String(e.category || 'working_notes'),
    }));
  } catch (error) {
    console.error('[Kimi] Failed to load memory:', error);
    return [];
  }
}

// ── Escalation Detection ────────────────────────────────────────────────────

/**
 * Check if a message triggers an escalation.
 * Returns null in Advisor mode (no escalations).
 */
export function checkEscalationTriggers(
  message: string,
  mode: KimiMode,
): EscalationTrigger | null {
  // No escalations in advisor mode
  if (mode === 'advisor') return null;

  const lower = message.toLowerCase();

  // User-requested escalation
  if (
    lower.includes('escalate') ||
    lower.includes('ask jhawk') ||
    lower.includes('check with jhawk') ||
    lower.includes('jhawk review') ||
    lower.includes('need approval')
  ) {
    return 'user_requested';
  }

  // Security-sensitive
  if (SECURITY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'security_sensitive';
  }

  // Infrastructure changes
  if (INFRASTRUCTURE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'infrastructure_change';
  }

  // Financial threshold
  if (FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    // Check for dollar amounts > $50
    const amounts = lower.match(/\$(\d+(?:\.\d{2})?)/g);
    if (amounts) {
      for (const amt of amounts) {
        const value = parseFloat(amt.replace('$', ''));
        if (value > 50) return 'financial_threshold';
      }
    }
  }

  // Cross-agent modification
  if (CROSS_AGENT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'cross_agent_modification';
  }

  return null;
}

// ── Severity Mapping ────────────────────────────────────────────────────────

const SEVERITY_MAP: Record<EscalationTrigger, EscalationSeverity> = {
  financial_threshold: 'high',
  infrastructure_change: 'high',
  low_confidence: 'medium',
  user_requested: 'medium',
  security_sensitive: 'critical',
  instruction_conflict: 'high',
  timeout: 'medium',
  cross_agent_modification: 'high',
};

/**
 * Get the severity for a given escalation trigger.
 */
export function getSeverity(trigger: EscalationTrigger): EscalationSeverity {
  return SEVERITY_MAP[trigger] || 'medium';
}

// ── Handoff Packet Generation ───────────────────────────────────────────────

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Generate a structured handoff packet for escalation.
 */
export function generateHandoffPacket(
  conversationId: string,
  conversationHistory: ConversationMessage[],
  trigger: EscalationTrigger,
  summary: string,
): HandoffPacket {
  const severity = getSeverity(trigger);

  // Include last 10 messages for context
  const relevantMessages = conversationHistory.slice(-10);

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    from: 'kimi',
    to: 'jhawk',
    trigger,
    severity,
    summary,
    context: {
      conversationId,
      messagesIncluded: relevantMessages.length,
      relevantMessages,
    },
    actions: {
      attempted: [],
      recommended: [],
      blocked: [],
    },
    risks: [],
    nextSteps: [],
    kimiMemorySnapshot: {
      activeTaskNotes: '',
      recentDecisions: [],
    },
  };
}
