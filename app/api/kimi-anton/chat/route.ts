/**
 * Kimi Portal Anton — Chat API Route
 * POST /api/kimi-anton/chat
 */

import { kimiChat, parseKimiStream } from '../../../../lib/kimi-anton/kimi.service';
import { buildSystemPrompt } from '../../../../lib/kimi-anton/kimi.prompts';
import {
  loadAntonProfile,
  loadKimiMemory,
  checkEscalationTriggers,
  getSeverity,
} from '../../../../lib/kimi-anton/chiefOperator.controller';
import { validateAttachments, buildUserMessageContent } from '../../../../lib/kimi-anton/kimi.attachments';
import { MAX_CONTEXT_MESSAGES } from '../../../../lib/kimi-anton/kimi.config';
import { incrementMessageCount } from '../../../../lib/kimi-anton/kimi.sessions';
import type { KimiChatRequest, KimiChatMessage, KimiSSEEvent } from '../../../../lib/kimi-anton/kimi.types';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

async function logChatActivity(sessionId: string | undefined, message: string) {
  if (!CONVEX_URL) return;
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'activities:create',
        args: {
          type: 'kimi_chat_message',
          agentId: 'kimi',
          taskId: null,
          message: `Kimi-Anton chat: ${message.slice(0, 120)}${message.length > 120 ? '...' : ''}`,
          metadata: { sessionId, agentName: 'Kimi-Anton', commander: 'anton', messagePreview: message.slice(0, 200) },
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

    if (!process.env.MOONSHOT_API_KEY) {
      console.error('[Kimi-Anton] MOONSHOT_API_KEY not set');
      return Response.json({ error: 'Kimi AI service not configured' }, { status: 500 });
    }

    if (attachments?.length) {
      const validation = validateAttachments(attachments);
      if (!validation.valid) {
        return Response.json({ error: validation.error }, { status: 400 });
      }
    }

    const startTime = Date.now();
    const [profile, memory] = await Promise.all([
      loadAntonProfile(),
      loadKimiMemory(),
    ]);
    const loadTime = Date.now() - startTime;

    const escalationTrigger = checkEscalationTriggers(message, mode);
    const systemPrompt = buildSystemPrompt(profile, memory, mode);

    const messages: KimiChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    const recentHistory = conversationHistory.slice(-MAX_CONTEXT_MESSAGES);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const userContent = buildUserMessageContent(message.trim(), attachments);
    messages.push({ role: 'user', content: userContent });

    if (sessionId) {
      incrementMessageCount(sessionId).catch(() => {});
    }
    logChatActivity(sessionId, message).catch(() => {});

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(sseEncode({
            type: 'meta',
            profileVersion: profile.version,
            memoryEntries: memory.length,
            mode,
          })));

          controller.enqueue(encoder.encode(sseEncode({
            type: 'log',
            timestamp: Date.now(),
            message: `Loaded anton_profile v${profile.version} + ${memory.length} memory entries (${loadTime}ms)`,
          })));

          if (attachments?.length) {
            for (const att of attachments) {
              controller.enqueue(encoder.encode(sseEncode({
                type: 'log',
                timestamp: Date.now(),
                message: `Attachment: ${att.filename} (${att.type}, ${att.sizeBytes} bytes)`,
              })));
            }
          }

          if (escalationTrigger) {
            controller.enqueue(encoder.encode(sseEncode({
              type: 'escalation',
              trigger: escalationTrigger,
              severity: getSeverity(escalationTrigger),
            })));
          }

          const apiStart = Date.now();
          const response = await kimiChat({ messages, stream: true });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error('[Kimi-Anton] Moonshot API error:', response.status, errorBody);
            controller.enqueue(encoder.encode(sseEncode({
              type: 'error',
              message: 'Kimi AI service error. Please try again.',
            })));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          for await (const token of parseKimiStream(response)) {
            controller.enqueue(encoder.encode(sseEncode({
              type: 'token',
              content: token,
            })));
          }

          const apiTime = Date.now() - apiStart;
          controller.enqueue(encoder.encode(sseEncode({
            type: 'log',
            timestamp: Date.now(),
            message: `API call complete (${(apiTime / 1000).toFixed(1)}s)`,
          })));

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[Kimi-Anton] Stream error:', error);
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
    console.error('[Kimi-Anton] Chat error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
