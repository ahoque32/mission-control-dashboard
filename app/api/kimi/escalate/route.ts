/**
 * Kimi Portal — Escalation API Route
 * POST /api/kimi/escalate
 *
 * Submits an escalation handoff packet to JHawk.
 * Persists to Convex and optionally notifies via Telegram.
 */

import {
  generateHandoffPacket,
  loadKimiMemory,
} from '../../../../lib/kimi/chiefOperator.controller';
import type { KimiEscalateRequest, EscalationTrigger } from '../../../../lib/kimi/kimi.types';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KimiEscalateRequest;
    const { conversationId, trigger, summary, userNotes, conversationHistory = [] } = body;

    if (!conversationId || !trigger || !summary) {
      return Response.json(
        { error: 'conversationId, trigger, and summary are required' },
        { status: 400 },
      );
    }

    // Generate handoff packet
    const packet = generateHandoffPacket(
      conversationId,
      conversationHistory,
      trigger as EscalationTrigger,
      summary,
    );

    // Load memory snapshot
    const memory = await loadKimiMemory();
    const workingNotes = memory.find((m) => m.category === 'working_notes');
    const decisions = memory
      .filter((m) => m.category === 'decisions')
      .map((m) => m.value)
      .slice(0, 5);

    packet.kimiMemorySnapshot = {
      activeTaskNotes: workingNotes?.value || '',
      recentDecisions: decisions,
    };

    // Persist to Convex
    let escalationId = '';
    if (CONVEX_URL) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'kimiEscalations:create',
            args: {
              conversationId: packet.context.conversationId,
              trigger: packet.trigger,
              severity: packet.severity,
              summary: packet.summary,
              context: packet.context,
              actions: packet.actions,
              risks: packet.risks,
              nextSteps: packet.nextSteps,
              kimiMemorySnapshot: packet.kimiMemorySnapshot,
              userNotes: userNotes || undefined,
            },
            format: 'json',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          escalationId = data.value || packet.id;
        }
      } catch (error) {
        console.error('[Kimi] Failed to persist escalation:', error);
      }

      // Log activity
      try {
        await fetch(`${CONVEX_URL}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'activities:create',
            args: {
              type: 'kimi_escalation_created',
              agentId: 'kimi',
              taskId: null,
              message: `Kimi escalated to JHawk: ${summary}`,
              metadata: {
                escalationId,
                trigger,
                severity: packet.severity,
                agentName: 'Kimi',
              },
            },
            format: 'json',
          }),
        });
      } catch (error) {
        console.error('[Kimi] Failed to log escalation activity:', error);
      }
    }

    return Response.json({
      escalationId: escalationId || packet.id,
      status: 'pending',
      notified: false, // Telegram notification is optional future enhancement
    });
  } catch (error) {
    console.error('[Kimi] Escalation error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
