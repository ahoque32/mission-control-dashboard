// app/api/chat/route.ts - Proxy route for OpenClaw Gateway chat completions
import { NextRequest } from 'next/server';
import { fetch as undiciFetch, ProxyAgent } from 'undici';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://100.114.7.2:3001';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
const TS_PROXY = process.env.HTTP_PROXY; // Tailscale outbound proxy on Cloud Run

const ALLOWED_AGENTS = ['main', 'dante-agent', 'dante-fast', 'vincent-agent'];

// Simple Firebase token verification (in production, use Firebase Admin SDK)
async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  try {
    // For MVP: verify token structure and check against allowed email
    // In production, use Firebase Admin SDK to verify
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    // Only allow admin@renderwise.net
    if (payload.email !== 'admin@renderwise.net') {
      return null;
    }
    
    return { uid: payload.user_id || payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Firebase auth
    const authHeader = req.headers.get('authorization');
    const idToken = authHeader?.replace('Bearer ', '');
    
    if (!idToken) {
      return Response.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const user = await verifyFirebaseToken(idToken);
    if (!user) {
      return Response.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { agentId, message, sessionId = 'default' } = body;

    console.log(`[chat] agentId=${agentId}, sessionId=${sessionId}, user=${user.email}`);

    // 3. Validate agent
    if (!agentId || !ALLOWED_AGENTS.includes(agentId)) {
      return Response.json({ error: `Invalid agent: ${agentId}` }, { status: 400 });
    }

    // 4. Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // 5. Check gateway configuration
    if (!GATEWAY_TOKEN) {
      console.error('OPENCLAW_GATEWAY_TOKEN not configured');
      return Response.json({ error: 'Gateway not configured' }, { status: 500 });
    }

    // 6. Derive stable session key
    const sessionKey = `mc:${user.uid}:${agentId}:${sessionId}`;

    // 7. Forward to Gateway
    const fetchFn = TS_PROXY ? undiciFetch : fetch;
    const fetchOpts: any = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': agentId,
        'x-openclaw-session-key': sessionKey,
      },
      body: JSON.stringify({
        model: `openclaw:${agentId}`,
        messages: [{ role: 'user', content: message.trim() }],
        stream: true,
        user: sessionKey,
      }),
    };

    // Route through Tailscale proxy on Cloud Run
    if (TS_PROXY) {
      fetchOpts.dispatcher = new ProxyAgent(TS_PROXY);
    }

    const gatewayResponse = await fetchFn(`${GATEWAY_URL}/v1/chat/completions`, fetchOpts) as unknown as Response;

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text().catch(() => 'Unknown error');
      console.error('Gateway error:', gatewayResponse.status, errorText);
      return Response.json(
        { error: 'Gateway request failed', details: errorText },
        { status: gatewayResponse.status }
      );
    }

    // 8. Stream SSE back to client
    return new Response(gatewayResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
