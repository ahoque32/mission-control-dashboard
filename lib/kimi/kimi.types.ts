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
