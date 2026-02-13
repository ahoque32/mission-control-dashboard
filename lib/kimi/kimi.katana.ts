/**
 * Kimi Portal — Katana Agent Service
 *
 * Routes messages to the katana-agent via the OpenClaw gateway API
 * instead of calling Moonshot directly. The katana-agent runs on
 * moonshot/kimi-k2.5 within OpenClaw.
 */

export interface KatanaResponse {
  response?: string;
  text?: string;
  output?: string;
  error?: string;
}

/**
 * Send a message to katana-agent via the OpenClaw gateway.
 * Returns the agent's text response.
 */
export async function sendToKatana(message: string): Promise<string> {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL;
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  if (!gatewayUrl || !gatewayToken) {
    throw new Error('OpenClaw gateway not configured (OPENCLAW_GATEWAY_URL / OPENCLAW_GATEWAY_TOKEN)');
  }

  const res = await fetch(`${gatewayUrl}/api/sessions/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gatewayToken}`,
    },
    body: JSON.stringify({
      agentId: 'katana-agent',
      message,
      timeoutSeconds: 120,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error');
    throw new Error(`Katana gateway error (${res.status}): ${errText}`);
  }

  const data: KatanaResponse = await res.json();

  // The gateway may return the response in different fields
  const reply = data.response || data.text || data.output;
  if (!reply) {
    console.warn('[Katana] Unexpected response shape:', JSON.stringify(data).slice(0, 500));
    return JSON.stringify(data);
  }

  return reply;
}
