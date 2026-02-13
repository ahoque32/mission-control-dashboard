/**
 * Kimi Portal v2 — Delegation Engine
 *
 * Handles task delegation from Kimi to worker agents.
 * Model overrides are always task-scoped — no permanent changes.
 */

import { checkPermission, canDelegate } from './kimi.permissions';
import { KIMI_MODEL } from './kimi.config';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// ── Types ───────────────────────────────────────────────────────────────────

export interface DelegationRequest {
  sessionId: string;
  callerAgent: string;
  targetAgent: string;
  taskDescription: string;
  context?: string;
}

export interface Delegation {
  delegationId: string;
  sessionId: string;
  callerAgent: string;
  targetAgent: string;
  taskDescription: string;
  modelOverride: string;
  modelOverrideScope: string;
  context?: string;
  status: string;
  result?: string;
  error?: string;
  createdAt: number;
  claimedAt?: number;
  completedAt?: number;
}

// ── Context-Based Routing ───────────────────────────────────────────────────

const ROUTING_SIGNALS: Record<string, string[]> = {
  ralph:     ['code', 'implement', 'build', 'fix bug', 'refactor', 'test', 'deploy', 'PR', 'commit'],
  scout:     ['research', 'investigate', 'find', 'search', 'analyze data', 'compare'],
  archivist: ['document', 'write docs', 'readme', 'spec', 'changelog', 'wiki'],
  sentinel:  ['monitor', 'performance', 'reliability', 'alert', 'uptime', 'security scan'],
};

/**
 * Suggest a target agent based on task description.
 * Returns null if no clear routing signal is detected.
 */
export function suggestTargetAgent(taskDescription: string): string | null {
  const lower = taskDescription.toLowerCase();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [agent, signals] of Object.entries(ROUTING_SIGNALS)) {
    const score = signals.filter((s) => lower.includes(s.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = agent;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// ── Delegation CRUD ─────────────────────────────────────────────────────────

/**
 * Create a new delegation.
 * Validates permissions, enforces task-scoped model override.
 */
export async function createDelegation(
  request: DelegationRequest,
): Promise<{ delegationId: string }> {
  if (!CONVEX_URL) throw new Error('CONVEX_URL not configured');

  // Permission check: can caller delegate?
  const delegatePermission = checkPermission(request.callerAgent, 'delegate_to_worker');
  if (!delegatePermission.allowed) {
    throw new Error(delegatePermission.reason);
  }

  // Permission check: can caller delegate to this target?
  const routePermission = canDelegate(request.callerAgent, request.targetAgent);
  if (!routePermission.allowed) {
    throw new Error(routePermission.reason);
  }

  const delegationId = `del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiDelegations:create',
      args: {
        delegationId,
        sessionId: request.sessionId,
        callerAgent: request.callerAgent,
        targetAgent: request.targetAgent,
        taskDescription: request.taskDescription,
        modelOverride: KIMI_MODEL,
        modelOverrideScope: 'task', // Always task-scoped
        context: request.context,
      },
      format: 'json',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create delegation: ${res.status} ${body}`);
  }

  return { delegationId };
}

/**
 * Get a delegation by ID.
 */
export async function getDelegation(delegationId: string): Promise<Delegation | null> {
  if (!CONVEX_URL) return null;

  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiDelegations:getById',
      args: { delegationId },
      format: 'json',
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.value as Delegation | null;
}

/**
 * Complete a delegation with result.
 */
export async function completeDelegation(
  delegationId: string,
  result: string,
): Promise<void> {
  if (!CONVEX_URL) throw new Error('CONVEX_URL not configured');

  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiDelegations:complete',
      args: { delegationId, result },
      format: 'json',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to complete delegation: ${res.status} ${body}`);
  }
}

/**
 * Fail a delegation with error.
 */
export async function failDelegation(
  delegationId: string,
  error: string,
): Promise<void> {
  if (!CONVEX_URL) throw new Error('CONVEX_URL not configured');

  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiDelegations:fail',
      args: { delegationId, error },
      format: 'json',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fail delegation: ${res.status} ${body}`);
  }
}

/**
 * List delegations for a session.
 */
export async function listSessionDelegations(
  sessionId: string,
  limit?: number,
): Promise<Delegation[]> {
  if (!CONVEX_URL) return [];

  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiDelegations:listBySession',
      args: { sessionId, limit },
      format: 'json',
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.value || []) as Delegation[];
}
