/**
 * Kimi Portal Anton — Delegation API Route
 * POST /api/kimi-anton/delegate
 * GET  /api/kimi-anton/delegate
 */

import {
  createDelegation,
  listSessionDelegations,
  suggestTargetAgent,
} from '../../../../lib/kimi-anton/kimi.delegation';

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
    const {
      sessionId,
      callerAgent = 'kimi',
      targetAgent,
      taskDescription,
      context,
    } = body;

    if (!sessionId || !taskDescription) {
      return Response.json(
        { error: 'sessionId and taskDescription are required' },
        { status: 400 },
      );
    }

    const resolvedTarget = targetAgent || suggestTargetAgent(taskDescription);
    if (!resolvedTarget) {
      return Response.json(
        { error: 'Could not determine target agent. Please specify targetAgent.' },
        { status: 400 },
      );
    }

    const result = await createDelegation({
      sessionId,
      callerAgent,
      targetAgent: resolvedTarget,
      taskDescription,
      context,
    });

    await logActivity('kimi_delegation_created', `Delegated task to ${resolvedTarget}: ${taskDescription.slice(0, 100)}`, {
      delegationId: result.delegationId,
      targetAgent: resolvedTarget,
      modelOverride: 'kimi-k2.5',
      taskDescription: taskDescription.slice(0, 200),
      sessionId,
    });

    return Response.json({
      delegationId: result.delegationId,
      targetAgent: resolvedTarget,
      modelOverride: 'kimi-k2.5',
      modelOverrideScope: 'task',
    });
  } catch (error) {
    console.error('[Kimi-Anton Delegate] Create error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create delegation';
    return Response.json({ error: message }, { status: 403 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!, 10)
      : undefined;

    if (!sessionId) {
      return Response.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 },
      );
    }

    const delegations = await listSessionDelegations(sessionId, limit);
    return Response.json({ delegations });
  } catch (error) {
    console.error('[Kimi-Anton Delegate] List error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to list delegations' },
      { status: 500 },
    );
  }
}
