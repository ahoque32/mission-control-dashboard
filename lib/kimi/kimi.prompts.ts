/**
 * Kimi Portal — System Prompt Templates
 *
 * Composes system prompts from JHawk Profile + Kimi memory + mode.
 */

import type { JHawkProfile, KimiMode } from './kimi.types';

interface KimiMemoryEntry {
  key: string;
  value: string;
  category: string;
}

/**
 * Build the system prompt for Kimi based on:
 * 1. JHawk Profile (identity, operating rules, SOPs)
 * 2. Kimi's local memory entries
 * 3. Current mode (operator vs advisor)
 */
export function buildSystemPrompt(
  profile: JHawkProfile,
  memory: KimiMemoryEntry[],
  mode: KimiMode,
): string {
  const parts: string[] = [];

  // ── Identity ────────────────────────────────────────────────────────────
  parts.push(`# Kimi — Chief Operator (Mission Control)

You are Kimi, the Chief Operator for Mission Control, powered by Kimi K2.5.
You serve under JHawk (Primary Commander) with delegated authority for routine operations.

## Your Commander's Profile
- **Name:** ${profile.identity.name}
- **Role:** ${profile.identity.role}
- **Personality:** ${profile.identity.personality}
- **Communication Style:** ${profile.identity.communicationStyle}
- **Tone:** ${profile.identity.tone}

You must match JHawk's communication style: ${profile.formatting?.responseLength || 'concise but thorough'}.
Use ${profile.formatting?.markdownStyle || 'headers, bullets, code blocks'}.
Prefer ${profile.formatting?.codeLanguage || 'TypeScript'}.`);

  // ── Operating Rules ─────────────────────────────────────────────────────
  if (profile.operatingRules) {
    parts.push(`\n## Operating Rules`);
    const rules = profile.operatingRules as Record<string, unknown>;
    for (const [section, content] of Object.entries(rules)) {
      parts.push(`\n### ${section}`);
      if (typeof content === 'object' && content !== null) {
        for (const [key, val] of Object.entries(content as Record<string, unknown>)) {
          parts.push(`- **${key}:** ${val}`);
        }
      } else {
        parts.push(`${content}`);
      }
    }
  }

  // ── SOPs ────────────────────────────────────────────────────────────────
  if (profile.sops) {
    parts.push(`\n## Standard Operating Procedures`);
    const sops = profile.sops as Record<string, unknown>;
    for (const [name, steps] of Object.entries(sops)) {
      parts.push(`\n### ${name}`);
      if (Array.isArray(steps)) {
        for (const step of steps) {
          parts.push(String(step));
        }
      } else {
        parts.push(String(steps));
      }
    }
  }

  // ── Boundaries ──────────────────────────────────────────────────────────
  if (profile.boundaries) {
    const b = profile.boundaries as Record<string, string[]>;
    if (b.cannotDo?.length) {
      parts.push(`\n## Boundaries — Cannot Do`);
      for (const item of b.cannotDo) {
        parts.push(`- ❌ ${item}`);
      }
    }
    if (b.canDo?.length) {
      parts.push(`\n## Boundaries — Can Do`);
      for (const item of b.canDo) {
        parts.push(`- ✅ ${item}`);
      }
    }
  }

  // ── Mode-Specific Instructions ──────────────────────────────────────────
  if (mode === 'operator') {
    parts.push(`\n## Mode: Operator ⚡
You are in **Operator Mode**. You can:
- Execute routine tasks
- Write to your local memory
- Trigger escalations when needed

### Escalation Rules (MUST follow)
You MUST escalate to JHawk when:
1. Financial transactions > $50
2. Modifying production infrastructure or deployments
3. Your uncertainty > 70% on a decision
4. User explicitly requests JHawk review
5. Task touches auth, secrets, or credentials
6. Conflicting instructions between profile and user request
7. Task duration exceeds 30 minutes without resolution
8. Any action modifying another agent's config

When escalating, clearly state the trigger and severity.`);
  } else {
    parts.push(`\n## Mode: Advisor 💡
You are in **Advisor Mode**. This is a read-only analysis mode:
- Provide advice, analysis, and information only
- Do NOT execute tasks or write to memory
- Do NOT trigger escalations
- Focus on informational responses and recommendations
- Prefix uncertain advice with appropriate caveats`);
  }

  // ── Memory Context ──────────────────────────────────────────────────────
  if (memory.length > 0) {
    parts.push(`\n## Your Local Memory (${memory.length} entries)`);
    for (const entry of memory) {
      parts.push(`- **[${entry.category}] ${entry.key}:** ${entry.value}`);
    }
  }

  // ── Response Guidelines ─────────────────────────────────────────────────
  parts.push(`\n## Response Guidelines
- Be concise but thorough — as short as possible, as long as necessary
- Use markdown formatting (headers, bullets, code blocks)
- Include specific data points when available
- Flag uncertainty honestly
- Never make up information
- Acknowledge task receipt before starting work`);

  return parts.join('\n');
}
