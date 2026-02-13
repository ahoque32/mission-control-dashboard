/**
 * Kimi Portal Anton — Permission System
 *
 * Extended hierarchy with Anton as direct commander.
 * JHawk retains override authority above Anton.
 */

// Re-export base types and functions
export {
  PROTECTED_RESOURCES,
  isProtectedResource,
  type PermissionAction,
  type PermissionResult,
} from '../kimi/kimi.permissions';

import type { PermissionResult } from '../kimi/kimi.permissions';

// ── Agent Hierarchy (Extended with Anton) ───────────────────────────────────

export const HIERARCHY = {
  jhawk:     { level: 0, canDelegate: ['anton', 'kimi', 'ralph', 'scout', 'archivist', 'sentinel'] },
  anton:     { level: 0.5, canDelegate: ['kimi', 'ralph', 'scout', 'archivist', 'sentinel'] },
  kimi:      { level: 1, canDelegate: ['ralph', 'scout', 'archivist', 'sentinel'] },
  ralph:     { level: 2, canDelegate: [] },
  scout:     { level: 2, canDelegate: [] },
  archivist: { level: 2, canDelegate: [] },
  sentinel:  { level: 2, canDelegate: [] },
} as const;

export type AgentName = keyof typeof HIERARCHY;

// Use the original permission checking for everything else
export { checkPermission, canDelegate, assertPermission } from '../kimi/kimi.permissions';
