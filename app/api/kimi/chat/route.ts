/**
 * Kimi Portal — Chat API Route
 * POST /api/kimi/chat
 *
 * Streams responses from Kimi K2.5 via SSE.
 * Loads JHawk profile + Kimi memory, builds system prompt,
 * detects escalation triggers, and streams back tokens.
 */

import { kimiChat, parseKimiStream } from '../../../../lib/kimi/kimi.service';
import { buildSystemPrompt } from '../../../../lib/kimi/kimi.prompts';
import {
  loadJHawkProfile,
  loadKimiMemory,
  checkEscalationTriggers,
  getSeverity,
} from '../../../../lib/kimi/chiefOperator.controller';
import { validateAttachments, buildUserMessageContent } from '../../../../lib/kimi/kimi.attachments';
import { MAX_CONTEXT_MESSAGES } from '../../../../lib/kimi/kimi.config';
import { incrementMessageCount } from '../../../../lib/kimi/kimi.sessions';
import { callKatana, parseKimiStream as parseKatanaStream } from '../../../../lib/kimi/kimi.katana';
import type { KimiChatRequest, KimiChatMessage, KimiSSEEvent } from '../../../../lib/kimi/kimi.types';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

async function logChatActivity(sessionId: string | undefined, message: string, chatMode: string = 'operator') {
  if (!CONVEX_URL) return;
  const label = chatMode === 'katana' ? 'Katana' : 'Kimi';
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'activities:create',
        args: {
          type: 'kimi_chat_message',
          agentId: chatMode === 'katana' ? 'katana' : 'kimi',
          taskId: null,
          message: `${label} chat: ${message.slice(0, 120)}${message.length > 120 ? '...' : ''}`,
          metadata: { sessionId, agentName: label, mode: chatMode, messagePreview: message.slice(0, 200) },
        },
        format: 'json',
      }),
    });
  } catch { /* best-effort */ }
}

function sseEncode(event: KimiSSEEvent | string): string {
  if (typeof event === 'string') return `data: ${event}\n\n`;
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KimiChatRequest & { sessionId?: string };
    const { message, mode = 'operator', attachments, conversationHistory = [], sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Track session message count + log activity
    if (sessionId) {
      incrementMessageCount(sessionId).catch(() => {});
    }
    logChatActivity(sessionId, message, mode).catch(() => {});

    // =========================================================================
    // KATANA MODE — route through OpenClaw gateway instead of Moonshot
    // =========================================================================
    if (mode === 'katana') {
      // Validate Moonshot API key (Katana uses Moonshot directly)
      if (!process.env.MOONSHOT_API_KEY) {
        console.error('[Katana] MOONSHOT_API_KEY not set');
        return Response.json({ error: 'Katana agent not configured' }, { status: 500 });
      }

      // Check for escalation triggers (still works in katana mode)
      const escalationTrigger = checkEscalationTriggers(message, mode);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send meta event
            controller.enqueue(encoder.encode(sseEncode({
              type: 'meta',
              profileVersion: 'katana',
              memoryEntries: 0,
              mode,
            })));

            controller.enqueue(encoder.encode(sseEncode({
              type: 'log',
              timestamp: Date.now(),
              message: 'Katana agent active (Kimi K2.5)...',
            })));

            // Send escalation advisory if detected
            if (escalationTrigger) {
              controller.enqueue(encoder.encode(sseEncode({
                type: 'escalation',
                trigger: escalationTrigger,
                severity: getSeverity(escalationTrigger),
              })));
            }

            // Call Katana via Moonshot API directly
            const apiStart = Date.now();
            const response = await callKatana(message.trim(), conversationHistory);

            if (!response.ok) {
              const errorBody = await response.text();
              console.error('[Katana] Moonshot API error:', response.status, errorBody);
              controller.enqueue(encoder.encode(sseEncode({
                type: 'error',
                message: 'Katana AI service error. Please try again.',
              })));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }

            // Stream tokens from Moonshot
            for await (const token of parseKatanaStream(response)) {
              controller.enqueue(encoder.encode(sseEncode({
                type: 'token',
                content: token,
              })));
            }

            const apiTime = Date.now() - apiStart;

            // Completion log
            controller.enqueue(encoder.encode(sseEncode({
              type: 'log',
              timestamp: Date.now(),
              message: `Katana responded (${(apiTime / 1000).toFixed(1)}s)`,
            })));

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Katana] Error:', error);
            controller.enqueue(encoder.encode(sseEncode({
              type: 'error',
              message: error instanceof Error ? error.message : 'Katana agent error',
            })));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // =========================================================================
    // OPERATOR / ADVISOR MODE — Moonshot API (existing behavior)
    // =========================================================================

    // Validate API key
    if (!process.env.MOONSHOT_API_KEY) {
      console.error('[Kimi] MOONSHOT_API_KEY not set');
      return Response.json({ error: 'Kimi AI service not configured' }, { status: 500 });
    }

    // Validate attachments if present
    if (attachments?.length) {
      const validation = validateAttachments(attachments);
      if (!validation.valid) {
        return Response.json({ error: validation.error }, { status: 400 });
      }
    }

    // Load profile and memory in parallel
    const startTime = Date.now();
    const [profile, memory] = await Promise.all([
      loadJHawkProfile(),
      loadKimiMemory(),
    ]);
    const loadTime = Date.now() - startTime;

    // Check for escalation triggers
    const escalationTrigger = checkEscalationTriggers(message, mode);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(profile, memory, mode);

    // Build messages array
    const messages: KimiChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (last N messages)
    const recentHistory = conversationHistory.slice(-MAX_CONTEXT_MESSAGES);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Build current user message with attachments
    const userContent = buildUserMessageContent(message.trim(), attachments);
    messages.push({ role: 'user', content: userContent });

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send meta event
          controller.enqueue(encoder.encode(sseEncode({
            type: 'meta',
            profileVersion: profile.version,
            memoryEntries: memory.length,
            mode,
          })));

          // Send log for profile/memory load
          controller.enqueue(encoder.encode(sseEncode({
            type: 'log',
            timestamp: Date.now(),
            message: `Loaded jhawk_profile v${profile.version} + ${memory.length} memory entries (${loadTime}ms)`,
          })));

          // Log attachments if present
          if (attachments?.length) {
            for (const att of attachments) {
              controller.enqueue(encoder.encode(sseEncode({
                type: 'log',
                timestamp: Date.now(),
                message: `Attachment: ${att.filename} (${att.type}, ${att.sizeBytes} bytes)`,
              })));
            }
          }

          // Send escalation advisory if detected
          if (escalationTrigger) {
            controller.enqueue(encoder.encode(sseEncode({
              type: 'escalation',
              trigger: escalationTrigger,
              severity: getSeverity(escalationTrigger),
            })));
          }

          // Call Moonshot API
          const apiStart = Date.now();
          const response = await kimiChat({ messages, stream: true });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('[Kimi] Moonshot API error:', response.status, errorBody);
            controller.enqueue(encoder.encode(sseEncode({
              type: 'error',
              message: 'Kimi AI service error. Please try again.',
            })));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          // Stream tokens
          for await (const token of parseKimiStream(response)) {
            controller.enqueue(encoder.encode(sseEncode({
              type: 'token',
              content: token,
            })));
          }

          const apiTime = Date.now() - apiStart;

          // Send completion log
          controller.enqueue(encoder.encode(sseEncode({
            type: 'log',
            timestamp: Date.now(),
            message: `API call complete (${(apiTime / 1000).toFixed(1)}s)`,
          })));

          // Send done
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[Kimi] Stream error:', error);
          controller.enqueue(encoder.encode(sseEncode({
            type: 'error',
            message: error instanceof Error ? error.message : 'Stream error',
          })));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Kimi] Chat error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
