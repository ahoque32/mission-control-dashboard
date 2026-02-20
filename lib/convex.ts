'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

// Re-export all types from types file
export type {
  Agent,
  AgentStatus,
  AgentLevel,
  Task,
  TaskStatus,
  TaskPriority,
  Message,
  Activity,
  ActivityType,
  Document,
  DocumentType,
  CronJob,
  CronJobCategory,
  SearchResult,
  SearchResultType,
} from '../types';

import type { Agent, Task, Activity, Message, Document as MCDocument, CronJob } from '../types';

// ============================================================================
// Convex document → app type converters
// ============================================================================
// Convex returns documents with `_id` (Id<"table">) and `_creationTime` (number).
// Our app types expect `id` (string) and Timestamp objects for date fields.
// We bridge the gap by creating lightweight shim objects that satisfy both
// `number` access (when code uses the raw value) and `.toMillis()` / `.toDate()`
// calls (legacy Timestamp-like usage in components).
// ============================================================================

/**
 * Creates a value that works as both a number AND a Timestamp-like object.
 * This lets existing component code call `.toMillis()` and `.toDate()`
 * while new code can use it as a plain number.
 */
function tsShim(ms: number | null | undefined): any {
  if (ms == null) return null;
  const val = Object.assign(Object(ms), {
    toMillis: () => ms,
    toDate: () => new Date(ms),
    valueOf: () => ms,
    [Symbol.toPrimitive]: () => ms,
  });
  return val;
}

function mapAgent(doc: any): Agent {
  return {
    id: doc._id,
    name: doc.name,
    role: doc.role,
    status: doc.status,
    currentTaskId: doc.currentTaskId,
    sessionKey: doc.sessionKey,
    emoji: doc.emoji,
    level: doc.level,
    lastHeartbeat: tsShim(doc.lastHeartbeat),
    createdAt: tsShim(doc.createdAt),
    updatedAt: tsShim(doc.updatedAt),
  } as Agent;
}

function mapTask(doc: any): Task {
  return {
    id: doc._id,
    title: doc.title || 'Untitled',
    description: doc.description || '',
    status: doc.status || 'inbox',
    priority: doc.priority || 'medium',
    assigneeIds: Array.isArray(doc.assigneeIds) ? doc.assigneeIds : [],
    createdBy: doc.createdBy,
    dueDate: tsShim(doc.dueDate),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    createdAt: tsShim(doc.createdAt),
    updatedAt: tsShim(doc.updatedAt),
  } as Task;
}

function mapActivity(doc: any): Activity {
  return {
    id: doc._id,
    type: doc.type || 'general',
    agentId: doc.agentId || '',
    taskId: doc.taskId || null,
    message: doc.message || '',
    metadata: doc.metadata || {},
    createdAt: tsShim(doc.createdAt),
  } as Activity;
}

function mapMessage(doc: any): Message {
  return {
    id: doc._id,
    taskId: doc.taskId,
    fromAgentId: doc.fromAgentId,
    content: doc.content,
    attachments: doc.attachments || [],
    mentions: doc.mentions || [],
    createdAt: tsShim(doc.createdAt),
  } as Message;
}

function mapDocument(doc: any): MCDocument {
  return {
    id: doc._id,
    title: doc.title,
    content: doc.content,
    type: doc.type,
    taskId: doc.taskId,
    createdBy: doc.createdBy,
    createdAt: tsShim(doc.createdAt),
    updatedAt: tsShim(doc.updatedAt),
  } as MCDocument;
}

function mapCronJob(doc: any): CronJob {
  return {
    id: doc._id,
    name: doc.name,
    schedule: doc.schedule,
    cronExpression: doc.cronExpression,
    category: doc.category,
    enabled: doc.enabled,
    description: doc.description,
    lastRun: tsShim(doc.lastRun),
    nextRun: tsShim(doc.nextRun),
    createdAt: tsShim(doc.createdAt),
    updatedAt: tsShim(doc.updatedAt),
  } as CronJob;
}

// ============================================================================
// Hook result types
// ============================================================================

interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  errorType: 'permission' | 'network' | 'not-found' | 'other' | null;
}

interface UseDocumentResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  errorType: 'permission' | 'network' | 'not-found' | 'other' | null;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Subscribe to agents collection
 */
export function useAgents(): UseCollectionResult<Agent> & { agents: Agent[] } {
  const raw = useQuery(api.agents.list);
  const agents = useMemo(() => (raw ?? []).map(mapAgent), [raw]);
  const loading = raw === undefined;
  return { agents, data: agents, loading, error: null, errorType: null };
}

/**
 * Subscribe to tasks collection (sorted by updatedAt desc)
 */
export function useTasks(): UseCollectionResult<Task> & { tasks: Task[] } {
  const raw = useQuery(api.tasks.list);
  const tasks = useMemo(() => (raw ?? []).map(mapTask), [raw]);
  const loading = raw === undefined;
  return { tasks, data: tasks, loading, error: null, errorType: null };
}

/**
 * Subscribe to activity collection (recent 50)
 */
export function useActivity(): UseCollectionResult<Activity> & { activities: Activity[] } {
  const raw = useQuery(api.activities.list, {});
  const activities = useMemo(() => (raw ?? []).map(mapActivity), [raw]);
  const loading = raw === undefined;
  return { activities, data: activities, loading, error: null, errorType: null };
}

/**
 * Subscribe to documents collection
 */
export function useDocuments(): UseCollectionResult<MCDocument> & { documents: MCDocument[] } {
  const raw = useQuery(api.documents.list);
  const documents = useMemo(() => (raw ?? []).map(mapDocument), [raw]);
  const loading = raw === undefined;
  return { documents, data: documents, loading, error: null, errorType: null };
}

/**
 * Subscribe to messages for a specific task
 */
export function useTaskMessages(taskId: string | null): UseCollectionResult<Message> & { messages: Message[] } {
  const raw = useQuery(
    api.messages.listByTask,
    taskId ? { taskId } : 'skip'
  );
  const messages = useMemo(() => (raw ?? []).map(mapMessage), [raw]);
  const loading = raw === undefined;
  return { messages, data: messages, loading, error: null, errorType: null };
}

/**
 * Get a single task by ID
 */
export function useTask(taskId: string | null): UseDocumentResult<Task> & { task: Task | null } {
  const raw = useQuery(
    api.tasks.getById,
    taskId ? { id: taskId as any } : 'skip'
  );
  const task = useMemo(() => (raw ? mapTask(raw) : null), [raw]);
  const loading = raw === undefined;
  return { task, data: task, loading, error: null, errorType: null };
}

/**
 * Subscribe to cron_jobs collection
 */
export function useCronJobs(): UseCollectionResult<CronJob> & { cronJobs: CronJob[] } {
  const raw = useQuery(api.cronJobs.list);
  const cronJobs = useMemo(() => (raw ?? []).map(mapCronJob), [raw]);
  const loading = raw === undefined;
  return { cronJobs, data: cronJobs, loading, error: null, errorType: null };
}

/**
 * Subscribe to activities with client-side pagination, agent filter, and type filter
 */
export function useActivityPaginated(
  pageSize: number = 25,
  agentFilter?: string,
  typeFilter?: string,
): UseCollectionResult<Activity> & {
  activities: Activity[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
} {
  const raw = useQuery(api.activities.list, { limit: 500 });
  const allActivities = useMemo(() => (raw ?? []).map(mapActivity), [raw]);
  const loading = raw === undefined;

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = allActivities;
    if (agentFilter) {
      result = result.filter(
        (a: typeof result[0]) =>
          a.agentId === agentFilter ||
          a.metadata?.agentName === agentFilter,
      );
    }
    if (typeFilter) {
      result = result.filter((a: typeof result[0]) => a.type === typeFilter);
    }
    return result;
  }, [allActivities, agentFilter, typeFilter]);

  // Client-side pagination
  const [displayCount, setDisplayCount] = useState(pageSize);

  // Build a stable filter key so we can reset pagination when filters change.
  // Using a ref to track the previous key avoids calling setState inside useMemo.
  const filterKey = `${agentFilter ?? ''}|${typeFilter ?? ''}|${pageSize}`;
  const prevFilterKey = useRef(filterKey);
  if (prevFilterKey.current !== filterKey) {
    prevFilterKey.current = filterKey;
    // Safe: this runs during render before commit, equivalent to getDerivedStateFromProps
    setDisplayCount(pageSize);
  }

  const activities = useMemo(
    () => filtered.slice(0, displayCount),
    [filtered, displayCount],
  );

  const hasMore = displayCount < filtered.length;

  const loadMore = useCallback(async () => {
    setDisplayCount((prev) => prev + pageSize);
  }, [pageSize]);

  return {
    activities,
    data: activities,
    loading,
    error: null,
    errorType: null,
    hasMore,
    loadMore,
    loadingMore: false,
  };
}

/**
 * Subscribe to recent activities for a specific agent (used by AgentCard)
 */
export function useAgentRecentActivity(agentId: string) {
  const raw = useQuery(api.activities.listByAgent, { agentId, limit: 10 });
  const activities = useMemo(() => (raw ?? []).map(mapActivity), [raw]);
  const loading = raw === undefined;
  return { activities, loading, error: null };
}

// ============================================================================
// Mutation helpers (used by components for direct writes)
// ============================================================================

/**
 * Returns a mutation function to update a task's status (for KanbanBoard drag-drop)
 */
export function useUpdateTaskStatus() {
  return useMutation(api.tasks.updateStatus);
}

/**
 * Returns a mutation function to create a new task (for NewTaskForm)
 */
export function useCreateTask() {
  return useMutation(api.tasks.create);
}

/**
 * Returns a mutation function to create a message (for TaskComments)
 */
export function useCreateMessage() {
  return useMutation(api.messages.create);
}

// ============================================================================
// Kimi Portal Hooks
// ============================================================================

function mapKimiMemory(doc: any): any {
  return {
    id: doc._id,
    key: doc.key,
    value: doc.value,
    category: doc.category,
    status: doc.status,
    createdAt: tsShim(doc.createdAt),
    updatedAt: tsShim(doc.updatedAt),
  };
}

function mapKimiEscalation(doc: any): any {
  return {
    id: doc._id,
    conversationId: doc.conversationId,
    trigger: doc.trigger,
    severity: doc.severity,
    summary: doc.summary,
    status: doc.status,
    createdAt: tsShim(doc.createdAt),
  };
}

function mapKimiLog(doc: any): any {
  return {
    id: doc._id,
    sessionId: doc.sessionId,
    timestamp: tsShim(doc.timestamp),
    level: doc.level,
    category: doc.category,
    message: doc.message,
    metadata: doc.metadata,
  };
}

export function useKimiMemory() {
  const raw = useQuery(api.kimiMemory.getActive);
  const data = useMemo(() => (raw ?? []).map(mapKimiMemory), [raw]);
  const loading = raw === undefined;
  return { data, loading, error: null };
}

export function useKimiEscalations() {
  const raw = useQuery(api.kimiEscalations.listPending);
  const data = useMemo(() => (raw ?? []).map(mapKimiEscalation), [raw]);
  const loading = raw === undefined;
  return { data, loading, error: null };
}

export function useKimiLogs(sessionId: string | null) {
  const raw = useQuery(
    api.kimiLogs.listBySession,
    sessionId ? { sessionId } : 'skip'
  );
  const data = useMemo(() => (raw ?? []).map(mapKimiLog), [raw]);
  const loading = raw === undefined;
  return { data, loading, error: null };
}

// Agent State Hook
export function useAgentState() {
  const raw = useQuery(api.agentState.all);
  const agentStates = useMemo(() => raw ?? [], [raw]);
  const loading = raw === undefined;
  return { agentStates, loading };
}

// ============================================================================
// MC Dashboard V2 Hooks
// ============================================================================

// Types for V2
export interface MCTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  column: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate: number | null;
  tags: string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  agentId?: string;
  agentName?: string;
  category: string;
  nextRun: number | null;
  lastRun: number | null;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ContentItem {
  id: string;
  title: string;
  stage: 'idea' | 'script' | 'thumbnail' | 'filming' | 'editing' | 'published';
  script?: string;
  thumbnail?: string;
  description?: string;
  agentId?: string;
  agentName?: string;
  tags: string[];
  metadata?: any;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  agentName: string;
  filePath: string;
  fileName: string;
  content: string;
  entryType: 'memory_md' | 'daily_note' | 'soul_md' | 'agents_md';
  date?: string;
  searchIndex: string[];
  updatedAt: number;
}

// Mappers
function mapMCTask(doc: any): MCTask {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description || '',
    status: doc.status,
    priority: doc.priority,
    column: doc.column,
    assigneeId: doc.assigneeId,
    assigneeName: doc.assigneeName,
    dueDate: doc.dueDate || null,
    tags: doc.tags || [],
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapScheduledTask(doc: any): ScheduledTask {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description || '',
    schedule: doc.schedule,
    agentId: doc.agentId,
    agentName: doc.agentName,
    category: doc.category || 'recurring',
    nextRun: doc.nextRun || null,
    lastRun: doc.lastRun || null,
    enabled: doc.enabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapContentItem(doc: any): ContentItem {
  return {
    id: doc._id,
    title: doc.title,
    stage: doc.stage,
    script: doc.script,
    thumbnail: doc.thumbnail,
    description: doc.description,
    agentId: doc.agentId,
    agentName: doc.agentName,
    tags: doc.tags || [],
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapMemoryEntry(doc: any): MemoryEntry {
  return {
    id: doc._id,
    agentId: doc.agentId,
    agentName: doc.agentName,
    filePath: doc.filePath,
    fileName: doc.fileName,
    content: doc.content,
    entryType: doc.entryType,
    date: doc.date,
    searchIndex: doc.searchIndex || [],
    updatedAt: doc.updatedAt,
  };
}

// MC Tasks Hooks
export function useMCTasks(): { tasks: MCTask[]; loading: boolean } {
  const raw = useQuery(api.mcTasks.list);
  const tasks = useMemo(() => (raw ?? []).map(mapMCTask), [raw]);
  const loading = raw === undefined;
  return { tasks, loading };
}

export function useMCTasksByColumn(column: string): { tasks: MCTask[]; loading: boolean } {
  const raw = useQuery(api.mcTasks.listByColumn, { column });
  const tasks = useMemo(() => (raw ?? []).map(mapMCTask), [raw]);
  const loading = raw === undefined;
  return { tasks, loading };
}

export function useCreateMCTask() {
  return useMutation(api.mcTasks.create);
}

export function useUpdateMCTaskColumn() {
  return useMutation(api.mcTasks.updateColumn);
}

export function useUpdateMCTask() {
  return useMutation(api.mcTasks.update);
}

export function useDeleteMCTask() {
  return useMutation(api.mcTasks.remove);
}

// Scheduled Tasks Hooks
export function useScheduledTasks(): { tasks: ScheduledTask[]; loading: boolean } {
  const raw = useQuery(api.scheduledTasks.list);
  const tasks = useMemo(() => (raw ?? []).map(mapScheduledTask), [raw]);
  const loading = raw === undefined;
  return { tasks, loading };
}

export function useCreateScheduledTask() {
  return useMutation(api.scheduledTasks.create);
}

export function useUpdateScheduledTask() {
  return useMutation(api.scheduledTasks.update);
}

export function useDeleteScheduledTask() {
  return useMutation(api.scheduledTasks.remove);
}

// Content Items Hooks
export function useContentItems(): { items: ContentItem[]; loading: boolean } {
  const raw = useQuery(api.contentItems.list);
  const items = useMemo(() => (raw ?? []).map(mapContentItem), [raw]);
  const loading = raw === undefined;
  return { items, loading };
}

export function useContentItemsByStage(stage: string): { items: ContentItem[]; loading: boolean } {
  const raw = useQuery(api.contentItems.listByStage, { stage });
  const items = useMemo(() => (raw ?? []).map(mapContentItem), [raw]);
  const loading = raw === undefined;
  return { items, loading };
}

export function useCreateContentItem() {
  return useMutation(api.contentItems.create);
}

export function useUpdateContentItem() {
  return useMutation(api.contentItems.update);
}

export function useMoveContentStage() {
  return useMutation(api.contentItems.moveStage);
}

export function useDeleteContentItem() {
  return useMutation(api.contentItems.remove);
}

// Memory Entries Hooks
export function useMemoryEntries(): { entries: MemoryEntry[]; loading: boolean } {
  const raw = useQuery(api.memoryEntries.list);
  const entries = useMemo(() => (raw ?? []).map(mapMemoryEntry), [raw]);
  const loading = raw === undefined;
  return { entries, loading };
}

export function useMemoryEntriesByAgent(agentId: string): { entries: MemoryEntry[]; loading: boolean } {
  const raw = useQuery(api.memoryEntries.listByAgent, { agentId });
  const entries = useMemo(() => (raw ?? []).map(mapMemoryEntry), [raw]);
  const loading = raw === undefined;
  return { entries, loading };
}

export function useSearchMemoryEntries(query: string, agentId?: string, entryType?: string) {
  const raw = useQuery(
    api.memoryEntries.search,
    query ? { query, agentId, entryType } : 'skip'
  );
  const entries = useMemo(() => (raw ?? []).map(mapMemoryEntry), [raw]);
  const loading = raw === undefined;
  return { entries, loading };
}
