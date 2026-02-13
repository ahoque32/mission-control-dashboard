/**
 * Kimi Portal Anton — Chief Operator Controller
 *
 * Loads Anton's profile instead of JHawk's.
 * All other logic (memory, escalation detection, handoff) is identical.
 */

import { FALLBACK_ANTON_PROFILE } from './kimi.config';
import {
  FINANCIAL_KEYWORDS,
  INFRASTRUCTURE_KEYWORDS,
  SECURITY_KEYWORDS,
  CROSS_AGENT_KEYWORDS,
} from '../kimi/kimi.config';
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
 * Fetch the Anton Profile from Convex.
 * Falls back to FALLBACK_ANTON_PROFILE on error.
 */
export async function loadAntonProfile(): Promise<JHawkProfile> {
  if (!CONVEX_URL) {
    console.warn('[Kimi-Anton] No CONVEX_URL set, using fallback profile');
    return FALLBACK_ANTON_PROFILE;
  }

  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'agentProfiles:getByProfileId',
        args: { profileId: 'anton_profile' },
        format: 'json',
      }),
    });

    if (!res.ok) {
      console.error(`[Kimi-Anton] Convex profile fetch failed: ${res.status}`);
      return FALLBACK_ANTON_PROFILE;
    }

    const data = await res.json();
    const profile = data.value;

    if (!profile) {
      console.warn('[Kimi-Anton] Anton profile not found in Convex, using fallback');
      return FALLBACK_ANTON_PROFILE;
    }

    return profile as JHawkProfile;
  } catch (error) {
    console.error('[Kimi-Anton] Failed to load Anton profile:', error);
    return FALLBACK_ANTON_PROFILE;
  }
}

// ── Memory Loading ──────────────────────────────────────────────────────────

interface KimiMemoryEntry {
  key: string;
  value: string;
  category: string;
}

/**
 * Fetch active Kimi memory entries from Convex (commander=anton).
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
    console.error('[Kimi-Anton] Failed to load memory:', error);
    return [];
  }
}

// ── Escalation Detection ────────────────────────────────────────────────────

/**
 * Check if a message triggers an escalation.
 * Escalation path: Kimi → Anton → JHawk
 */
export function checkEscalationTriggers(
  message: string,
  mode: KimiMode,
): EscalationTrigger | null {
  if (mode === 'advisor') return null;

  const lower = message.toLowerCase();

  // User-requested escalation (updated for Anton)
  if (
    lower.includes('escalate') ||
    lower.includes('ask anton') ||
    lower.includes('check with anton') ||
    lower.includes('anton review') ||
    lower.includes('ask jhawk') ||
    lower.includes('jhawk review') ||
    lower.includes('need approval')
  ) {
    return 'user_requested';
  }

  if (SECURITY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'security_sensitive';
  }

  if (INFRASTRUCTURE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'infrastructure_change';
  }

  if (FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    const amounts = lower.match(/\$(\d+(?:\.\d{2})?)/g);
    if (amounts) {
      for (const amt of amounts) {
        const value = parseFloat(amt.replace('$', ''));
        if (value > 50) return 'financial_threshold';
      }
    }
  }

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
 * Escalation path: Kimi → Anton → JHawk
 */
export function generateHandoffPacket(
  conversationId: string,
  conversationHistory: ConversationMessage[],
  trigger: EscalationTrigger,
  summary: string,
): HandoffPacket {
  const severity = getSeverity(trigger);
  const relevantMessages = conversationHistory.slice(-10);

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    from: 'kimi',
    to: 'jhawk', // escalation ultimately goes to JHawk via Anton
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
