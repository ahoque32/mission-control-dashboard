/**
 * Mission Control TypeScript Type Definitions
 * Based on schema.js - Firestore data model
 */

import { Timestamp } from 'firebase/firestore';

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
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeIds: string[];
  createdBy: string;
  dueDate: Timestamp | null;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollection: tasks/{taskId}/comments
export interface TaskComment {
  id: string;
  fromAgentId: string;
  content: string;
  mentions: string[];
  createdAt: Timestamp;
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
  | 'message_sent' 
  | 'document_created' 
  | 'agent_status_changed'
  | 'session_created'
  | 'session_state_changed'
  | 'agent_task_started'
  | 'agent_task_completed'
  | 'agent_task_failed'
  | 'agent_run_started'
  | 'agent_run_completed';

export interface Activity {
  id: string;
  type: ActivityType;
  agentId: string;
  taskId: string | null;
  message: string;
  metadata: Record<string, any>;
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
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  mentionedAgentId: string;
  fromAgentId: string;
  taskId: string | null;
  messageId: string | null;
  content: string;
  delivered: boolean;
  deliveredAt: Timestamp | null;
  createdAt: Timestamp;
}
