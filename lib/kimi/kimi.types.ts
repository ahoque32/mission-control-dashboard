/**
 * Kimi Portal — Shared TypeScript Types
 */

// ============================================================================
// Mode & Core Types
// ============================================================================

export type KimiMode = 'operator' | 'advisor';

export type EscalationTrigger =
  | 'financial_threshold'
  | 'infrastructure_change'
  | 'low_confidence'
  | 'user_requested'
  | 'security_sensitive'
  | 'instruction_conflict'
  | 'timeout'
  | 'cross_agent_modification';

export type EscalationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EscalationStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

export type MemoryCategory =
  | 'working_notes'
  | 'task_state'
  | 'decisions'
  | 'drafts'
  | 'observations'
  | 'escalation_history';

export type MemoryStatus = 'active' | 'archived' | 'purged';

// ============================================================================
// Message Types
// ============================================================================

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'auto' | 'low' | 'high' } };

export interface KimiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

// ============================================================================
// Attachment Types
// ============================================================================

export type AttachmentType = 'image' | 'document' | 'code';

export interface ProcessedAttachment {
  type: AttachmentType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  base64?: string;
  textContent?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface KimiChatRequest {
  message: string;
  mode: KimiMode;
  attachments?: ProcessedAttachment[];
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export interface KimiEscalateRequest {
  conversationId: string;
  trigger: EscalationTrigger;
  summary: string;
  userNotes?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export interface KimiMemoryWriteRequest {
  key: string;
  value: string;
  category: MemoryCategory;
}

// ============================================================================
// SSE Event Types
// ============================================================================

export type KimiSSEEvent =
  | { type: 'meta'; profileVersion: string; memoryEntries: number; mode: KimiMode }
  | { type: 'token'; content: string }
  | { type: 'escalation'; trigger: EscalationTrigger; severity: EscalationSeverity }
  | { type: 'memory_write'; key: string; category: MemoryCategory }
  | { type: 'log'; timestamp: number; message: string }
  | { type: 'error'; message: string };

// ============================================================================
// Profile Types
// ============================================================================

export interface JHawkProfileIdentity {
  name: string;
  role: string;
  personality: string;
  communicationStyle: string;
  tone: string;
}

export interface JHawkProfile {
  profileId: string;
  version: string;
  lastUpdatedBy: string;
  lastUpdatedAt: number;
  identity: JHawkProfileIdentity;
  operatingRules: Record<string, unknown>;
  sops: Record<string, unknown>;
  formatting: Record<string, unknown>;
  boundaries: Record<string, unknown>;
}

// ============================================================================
// Session Types (v2)
// ============================================================================

export type SessionOwner = 'jhawk' | 'kimi';
export type SessionStatus = 'active' | 'closed' | 'suspended';

export interface KimiSessionInfo {
  sessionId: string;
  owner: SessionOwner;
  status: SessionStatus;
  mode: KimiMode;
  messageCount: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  closedAt?: number;
}

// ============================================================================
// Delegation Types (v2)
// ============================================================================

export type DelegationStatus = 'pending' | 'claimed' | 'in_progress' | 'completed' | 'failed';

export interface KimiDelegation {
  delegationId: string;
  sessionId: string;
  callerAgent: string;
  targetAgent: string;
  taskDescription: string;
  modelOverride: string;
  modelOverrideScope: 'task'; // Always task-scoped
  context?: string;
  status: DelegationStatus;
  result?: string;
  error?: string;
  createdAt: number;
  claimedAt?: number;
  completedAt?: number;
}

// ============================================================================
// Permission Types (v2)
// ============================================================================

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  callerAgent: string;
  action: string;
}

// ============================================================================
// Activity Types (v2 additions)
// ============================================================================

export type KimiActivityType =
  | 'kimi_session_started'
  | 'kimi_session_closed'
  | 'kimi_chat_message'
  | 'kimi_delegation_created'
  | 'kimi_delegation_completed'
  | 'kimi_delegation_failed'
  | 'kimi_model_override'
  | 'kimi_github_branch'
  | 'kimi_github_commit'
  | 'kimi_github_push'
  | 'kimi_github_pr'
  | 'kimi_permission_denied'
  | 'kimi_escalation_created'
  | 'kimi_memory_write';

// ============================================================================
// Handoff Packet
// ============================================================================

export interface HandoffPacket {
  id: string;
  timestamp: number;
  from: 'kimi';
  to: 'jhawk';
  trigger: EscalationTrigger;
  severity: EscalationSeverity;
  summary: string;
  context: {
    conversationId: string;
    messagesIncluded: number;
    relevantMessages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>;
  };
  actions: {
    attempted: string[];
    recommended: string[];
    blocked: string[];
  };
  risks: string[];
  nextSteps: string[];
  kimiMemorySnapshot: {
    activeTaskNotes: string;
    recentDecisions: string[];
  };
}
