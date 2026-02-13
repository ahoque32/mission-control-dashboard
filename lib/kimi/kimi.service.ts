/**
 * Kimi Portal — Moonshot API Client with Streaming
 *
 * Provides the core API client for communicating with Moonshot's Kimi K2.5 model.
 * Follows the OpenAI-compatible API format used by Moonshot.
 */

import {
  MOONSHOT_BASE_URL,
  KIMI_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from './kimi.config';
import type { KimiChatMessage } from './kimi.types';

interface KimiChatOptions {
  messages: KimiChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Send a chat request to the Moonshot API.
 * Returns the raw Response for streaming consumption.
 */
export async function kimiChat(options: KimiChatOptions): Promise<Response> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error('MOONSHOT_API_KEY not configured');

  return fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages: options.messages,
      stream: options.stream ?? true,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    }),
  });
}

/**
 * Parse an SSE stream from the Moonshot API.
 * Yields individual content tokens as they arrive.
 */
export async function* parseKimiStream(
  response: Response
): AsyncGenerator<string, void, void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const chunk = JSON.parse(data);
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Format bytes into human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
