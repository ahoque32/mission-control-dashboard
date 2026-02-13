/**
 * Kimi Portal Anton — Sessions API Route
 * POST  /api/kimi-anton/sessions
 * GET   /api/kimi-anton/sessions
 * PATCH /api/kimi-anton/sessions
 */

import { createSession, closeSession, listSessions } from '../../../../lib/kimi-anton/kimi.sessions';
import { checkPermission } from '../../../../lib/kimi-anton/kimi.permissions';
import type { KimiMode } from '../../../../lib/kimi-anton/kimi.types';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

async function logActivity(type: string, message: string, metadata: Record<string, unknown>) {
  if (!CONVEX_URL) return;
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'activities:create',
        args: { type, agentId: 'kimi', taskId: null, message, metadata: { ...metadata, agentName: 'Kimi-Anton', commander: 'anton' } },
        format: 'json',
      }),
    });
  } catch { /* best-effort */ }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner = 'kimi', mode = 'operator', callerAgent = 'kimi' } = body;

    if (owner !== callerAgent) {
      const perm = checkPermission(callerAgent, 'spawn_kimi_session');
      if (!perm.allowed) {
        return Response.json({ error: perm.reason }, { status: 403 });
      }
    }

    const result = await createSession(
      owner as 'jhawk' | 'kimi',
      mode as KimiMode,
    );

    await logActivity('kimi_session_started', `Kimi-Anton session started (${mode} mode)`, {
      sessionId: result.sessionId,
      owner,
      mode,
    });

    return Response.json(result);
  } catch (error) {
    console.error('[Kimi-Anton Sessions] Create error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner') || 'kimi';
    const status = url.searchParams.get('status') || undefined;
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!, 10)
      : undefined;

    const sessions = await listSessions(owner, status, limit);
    return Response.json({ sessions });
  } catch (error) {
    console.error('[Kimi-Anton Sessions] List error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to list sessions' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId) {
      return Response.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (action === 'close') {
      await closeSession(sessionId);

      await logActivity('kimi_session_closed', `Kimi-Anton session closed`, {
        sessionId,
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[Kimi-Anton Sessions] Patch error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update session' },
      { status: 500 },
    );
  }
}
