/**
 * Kimi Portal v2 — Session Management
 *
 * Handles session creation, isolation enforcement, and lifecycle.
 * All Convex calls go through the public HTTP API (server-side).
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export interface KimiSession {
  sessionId: string;
  owner: string;
  status: string;
  mode: string;
  messageCount: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  closedAt?: number;
}

/**
 * Create a new Kimi session via Convex.
 */
export async function createSession(
  owner: 'jhawk' | 'kimi',
  mode: 'operator' | 'advisor',
  metadata?: Record<string, unknown>,
): Promise<{ sessionId: string }> {
  if (!CONVEX_URL) throw new Error('CONVEX_URL not configured');

  const sessionId = `kimi-${owner}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiSessions:create',
      args: { sessionId, owner, mode, metadata },
      format: 'json',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create session: ${res.status} ${body}`);
  }

  return { sessionId };
}

/**
 * Get a session by ID.
 */
export async function getSession(sessionId: string): Promise<KimiSession | null> {
  if (!CONVEX_URL) return null;

  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiSessions:getBySessionId',
      args: { sessionId },
      format: 'json',
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.value as KimiSession | null;
}

/**
 * Close a session.
 */
export async function closeSession(sessionId: string): Promise<void> {
  if (!CONVEX_URL) throw new Error('CONVEX_URL not configured');

  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiSessions:close',
      args: { sessionId },
      format: 'json',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to close session: ${res.status} ${body}`);
  }
}

/**
 * Increment message count for a session.
 */
export async function incrementMessageCount(sessionId: string): Promise<void> {
  if (!CONVEX_URL) return;

  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'kimiSessions:incrementMessageCount',
        args: { sessionId },
        format: 'json',
      }),
    });
  } catch (error) {
    console.error('[Kimi] Failed to increment message count:', error);
  }
}

/**
 * List sessions by owner.
 */
export async function listSessions(
  owner: string,
  status?: string,
  limit?: number,
): Promise<KimiSession[]> {
  if (!CONVEX_URL) return [];

  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'kimiSessions:listByOwner',
      args: { owner, status, limit },
      format: 'json',
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.value || []) as KimiSession[];
}
