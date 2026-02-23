/**
 * Agent Communications API
 *
 * Uses the existing Convex activities table (type="agent_comm") to store
 * communication events. This works without deploying new Convex functions.
 *
 * When agentComms Convex module is deployed, switch to direct Convex queries.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://courteous-quail-705.convex.cloud';

export interface AgentComm {
  id: string;
  from: string;
  to: string;
  channel: 'convex' | 'telegram' | 'spawn' | 'session' | string;
  message: string;
  metadata: Record<string, any>;
  createdAt: number;
}

/**
 * Log a communication event via Convex activities:create
 */
export async function logComm(comm: Omit<AgentComm, 'id'>): Promise<void> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'activities:create',
      args: {
        type: 'agent_comm',
        agentId: comm.from,
        taskId: null,
        message: comm.message,
        metadata: {
          from: comm.from,
          to: comm.to,
          channel: comm.channel,
          commTimestamp: comm.createdAt,
          ...comm.metadata,
        },
        createdAt: comm.createdAt,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to log comm: ${res.status}`);
  }
}

/**
 * Fetch communications from Convex activities (type="agent_comm")
 */
export async function fetchComms(opts?: {
  limit?: number;
  channel?: string;
  from?: string;
  to?: string;
}): Promise<AgentComm[]> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'activities:list',
      args: { limit: 500 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch comms: ${res.status}`);
  }

  const json = await res.json();
  const activities = json.value || json || [];

  // Filter to agent_comm or communication type and transform
  const COMM_TYPES = ['agent_comm', 'communication'];
  let comms: AgentComm[] = activities
    .filter((a: any) => COMM_TYPES.includes(a.type))
    .map((a: any) => ({
      id: a._id,
      from: a.metadata?.from || a.agentId || 'unknown',
      to: a.metadata?.to || 'unknown',
      channel: a.metadata?.channel || 'unknown',
      message: a.message,
      metadata: a.metadata || {},
      createdAt: a.metadata?.commTimestamp || a.createdAt,
    }));

  // Apply client-side filters
  if (opts?.channel) {
    comms = comms.filter(c => c.channel === opts.channel);
  }
  if (opts?.from) {
    comms = comms.filter(c => c.from === opts.from);
  }
  if (opts?.to) {
    comms = comms.filter(c => c.to === opts.to);
  }
  if (opts?.limit) {
    comms = comms.slice(0, opts.limit);
  }

  return comms;
}
