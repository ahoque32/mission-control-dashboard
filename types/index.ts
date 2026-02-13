/**
 * Mission Control TypeScript Type Definitions
 * Convex backend — timestamps are numbers with shim compatibility
 */

// Convex stores timestamps as Unix ms (number).
// The convex.ts hooks wrap them with a shim providing .toMillis() / .toDate()
// for backward compatibility. Using `any` to avoid narrowing issues with
// intersection types in components that do runtime type checks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Timestamp = any;

// ============================================================================
// Agent Types
// ============================================================================

export type AgentStatus = 'idle' | 'active' | 'blocked';
export type AgentLevel = 'intern' | 'specialist' | 'lead';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTaskId: string | null;
  sessionKey: string;
  emoji: string;
  level: AgentLevel;
  lastHeartbeat: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  createdBy: string;
  dueDate: Timestamp | null;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string;
  taskId: string;
  fromAgentId: string;
  content: string;
  attachments: string[];
  mentions: string[];
  createdAt: Timestamp;
}

// ============================================================================
// Activity Types
// ============================================================================

export type ActivityType =
  | 'task_created'
  | 'task_updated'
  | 'task_assigned'
  | 'task_completed'
  | 'task_started'
  | 'message_sent'
  | 'document_created'
  | 'agent_status_changed'
  | 'session_created'
  | 'session_state_changed'
  | 'agent_task_started'
  | 'agent_task_completed'
  | 'agent_task_failed'
  | 'agent_run_started'
  | 'agent_run_completed'
  | 'research'
  | 'deployment'
  | 'code_review'
  | 'system_maintenance'
  | 'communication'
  | 'monitoring'
  | 'spawn_completed'
  | 'spawn_failed'
  | 'general';

export interface ActivityMetadata {
  agentName?: string;
  taskName?: string;
  duration?: number;
  errorSummary?: string;
  iterationCount?: number;
  [key: string]: any;
}

export interface Activity {
  id: string;
  type: ActivityType;
  agentId: string;
  taskId: string | null;
  message: string;
  metadata: ActivityMetadata;
  createdAt: Timestamp;
}

// ============================================================================
// Document Types
// ============================================================================

export type DocumentType = 'deliverable' | 'research' | 'protocol' | 'note';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  taskId: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Cron Job Types (Calendar View)
// ============================================================================

export type CronJobCategory = 'maintenance' | 'monitoring' | 'reports' | 'builds' | 'security' | 'communication';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;          // Human-readable schedule description
  cronExpression: string;    // Cron expression for computing next runs
  category: CronJobCategory;
  enabled: boolean;
  description?: string;
  lastRun?: Timestamp;
  nextRun?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Search Result Types
// ============================================================================

export type SearchResultType = 'task' | 'activity' | 'document';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet: string;
  timestamp: Timestamp;
  url: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Kimi Portal Types
// ============================================================================

export type KimiMode = 'operator' | 'advisor';

export interface KimiUIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode: KimiMode;
  escalationTriggered?: boolean;
  attachments?: KimiUIAttachment[];
}

export type AttachmentType = 'image' | 'document' | 'code';
export type AttachmentStatus = 'processing' | 'ready' | 'error';

export interface KimiUIAttachment {
  id: string;
  file: File;
  type: AttachmentType;
  status: AttachmentStatus;
  preview: string | null;
  textContent: string | null;
  base64: string | null;
  error: string | null;
  sizeBytes: number;
}

export interface ProcessedUIAttachment {
  type: AttachmentType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  base64?: string;
  textContent?: string;
}

export interface KimiMemoryEntry {
  id: string;
  key: string;
  value: string;
  category: string;
  status: 'active' | 'archived' | 'purged';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KimiEscalation {
  id: string;
  conversationId: string;
  trigger: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
}

export interface KimiLog {
  id: string;
  sessionId: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  metadata?: Record<string, any>;
}
