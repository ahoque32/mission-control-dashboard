/**
 * Kimi Portal v2 — Permission System
 *
 * Hardcoded agent hierarchy and RBAC matrix.
 * These values are CODE-LEVEL CONSTANTS — not stored in mutable config.
 * Only JHawk (via code changes) can modify this file.
 */

// ── Agent Hierarchy (Immutable) ─────────────────────────────────────────────

export const HIERARCHY = {
  jhawk:     { level: 0, canDelegate: ['kimi', 'ralph', 'scout', 'archivist', 'sentinel'] },
  kimi:      { level: 1, canDelegate: ['ralph', 'scout', 'archivist', 'sentinel'] },
  ralph:     { level: 2, canDelegate: [] },
  scout:     { level: 2, canDelegate: [] },
  archivist: { level: 2, canDelegate: [] },
  sentinel:  { level: 2, canDelegate: [] },
} as const;

export type AgentName = keyof typeof HIERARCHY;

// ── Protected Resources ─────────────────────────────────────────────────────

export const PROTECTED_RESOURCES = [
  'agent_profiles:jhawk_profile',
  'system_prompts',
  'model_assignments',
  'hierarchy_config',
  'restricted_secrets',
] as const;

// ── RBAC Actions ────────────────────────────────────────────────────────────

export type PermissionAction =
  | 'read_all_data'
  | 'write_kimi_memory'
  | 'modify_jhawk_config'
  | 'modify_hierarchy'
  | 'modify_model_routing'
  | 'spawn_kimi_session'
  | 'delegate_to_worker'
  | 'create_branch'
  | 'commit_push'
  | 'open_pr'
  | 'merge_protected_branch'
  | 'access_restricted_secrets'
  | 'log_activity'
  | 'escalate_to_jhawk'
  | 'close_own_session'
  | 'view_audit_logs';

// Actions that are JHAWK-ONLY (immutable — cannot be granted to others)
const JHAWK_ONLY_ACTIONS: PermissionAction[] = [
  'modify_jhawk_config',
  'modify_hierarchy',
  'modify_model_routing',
  'spawn_kimi_session',
  'merge_protected_branch',
  'access_restricted_secrets',
];

// Actions available to Kimi (Level 1)
const KIMI_ACTIONS: PermissionAction[] = [
  'read_all_data',
  'write_kimi_memory',
  'delegate_to_worker',
  'create_branch',
  'commit_push',
  'open_pr',
  'log_activity',
  'escalate_to_jhawk',
  'close_own_session',
  'view_audit_logs',
];

// Actions available to Workers (Level 2)
const WORKER_ACTIONS: PermissionAction[] = [
  'log_activity',
  'escalate_to_jhawk',
];

// ── Permission Check ────────────────────────────────────────────────────────

export interface PermissionResult {
  allowed: boolean;
  reason: string;
}

/**
 * Check if an agent is allowed to perform an action.
 * Returns { allowed, reason } for audit logging.
 */
export function checkPermission(
  callerAgent: string,
  action: PermissionAction,
): PermissionResult {
  const agent = callerAgent.toLowerCase() as AgentName;

  // JHawk can do everything
  if (agent === 'jhawk') {
    return { allowed: true, reason: 'JHawk: supreme authority' };
  }

  // JHawk-only actions
  if (JHAWK_ONLY_ACTIONS.includes(action)) {
    return {
      allowed: false,
      reason: `DENIED: "${action}" is restricted to JHawk. ${agent} (level ${HIERARCHY[agent]?.level ?? '?'}) cannot perform this action.`,
    };
  }

  // Kimi checks
  if (agent === 'kimi') {
    if (KIMI_ACTIONS.includes(action)) {
      return { allowed: true, reason: `Kimi: action "${action}" is permitted` };
    }
    return {
      allowed: false,
      reason: `DENIED: Kimi cannot perform "${action}"`,
    };
  }

  // Worker checks
  if (HIERARCHY[agent]) {
    if (WORKER_ACTIONS.includes(action)) {
      return { allowed: true, reason: `Worker ${agent}: action "${action}" is permitted` };
    }
    return {
      allowed: false,
      reason: `DENIED: Worker ${agent} cannot perform "${action}"`,
    };
  }

  // Unknown agent
  return {
    allowed: false,
    reason: `DENIED: Unknown agent "${callerAgent}"`,
  };
}

/**
 * Check if an agent can delegate to a target.
 */
export function canDelegate(callerAgent: string, targetAgent: string): PermissionResult {
  const caller = callerAgent.toLowerCase() as AgentName;
  const target = targetAgent.toLowerCase() as AgentName;

  if (!HIERARCHY[caller]) {
    return { allowed: false, reason: `Unknown caller agent: ${callerAgent}` };
  }

  if (!HIERARCHY[target]) {
    return { allowed: false, reason: `Unknown target agent: ${targetAgent}` };
  }

  if (caller === target) {
    return { allowed: false, reason: 'Cannot delegate to self' };
  }

  const callerDelegates = HIERARCHY[caller].canDelegate as readonly string[];
  if (callerDelegates.includes(target)) {
    return { allowed: true, reason: `${caller} can delegate to ${target}` };
  }

  return {
    allowed: false,
    reason: `DENIED: ${caller} cannot delegate to ${target}`,
  };
}

/**
 * Check if a resource is protected.
 */
export function isProtectedResource(resource: string): boolean {
  return PROTECTED_RESOURCES.some((p) => resource.startsWith(p));
}

/**
 * Assert a permission (throws on denial).
 */
export function assertPermission(
  callerAgent: string,
  action: PermissionAction,
): void {
  const result = checkPermission(callerAgent, action);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}
