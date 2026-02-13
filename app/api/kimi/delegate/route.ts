/**
 * Kimi Portal v2 — Delegation API Route
 * POST /api/kimi/delegate — Create a new delegation
 * GET  /api/kimi/delegate — List delegations for a session
 */

import {
  createDelegation,
  listSessionDelegations,
  suggestTargetAgent,
} from '../../../../lib/kimi/kimi.delegation';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

async function logActivity(type: string, message: string, metadata: Record<string, unknown>) {
  if (!CONVEX_URL) return;
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'activities:create',
        args: { type, agentId: 'kimi', taskId: null, message, metadata: { ...metadata, agentName: 'Kimi' } },
        format: 'json',
      }),
    });
  } catch { /* best-effort */ }
}

async function logPermission(
  callerAgent: string,
  action: string,
  resource: string,
  allowed: boolean,
  reason: string,
  sessionId?: string,
) {
  if (!CONVEX_URL) return;
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'kimiPermissions:log',
        args: { callerAgent, action, resource, allowed, reason, sessionId },
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

    // Auto-suggest target if not provided
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

    // Log permission check
    await logPermission(
      callerAgent,
      'delegate_to_worker',
      `delegation:${resolvedTarget}`,
      true,
      `Delegation created: ${result.delegationId}`,
      sessionId,
    );

    // Log activity
    await logActivity('kimi_delegation_created', `Delegated task to ${resolvedTarget}: ${taskDescription.slice(0, 100)}`, {
      delegationId: result.delegationId,
      targetAgent: resolvedTarget,
      modelOverride: 'kimi-k2.5',
      taskDescription: taskDescription.slice(0, 200),
      sessionId,
    });

    // Log model override activity
    await logActivity('kimi_model_override', `Model override applied: kimi-k2.5 → ${resolvedTarget} (task-scoped)`, {
      delegationId: result.delegationId,
      targetAgent: resolvedTarget,
      modelOverride: 'kimi-k2.5',
      scope: 'task',
      sessionId,
    });

    return Response.json({
      delegationId: result.delegationId,
      targetAgent: resolvedTarget,
      modelOverride: 'kimi-k2.5',
      modelOverrideScope: 'task',
    });
  } catch (error) {
    console.error('[Kimi Delegate] Create error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create delegation';

    // Log denied permissions
    if (message.includes('DENIED')) {
      await logActivity('kimi_permission_denied', message, {
        action: 'delegate_to_worker',
      });
    }

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
    console.error('[Kimi Delegate] List error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to list delegations' },
      { status: 500 },
    );
  }
}
