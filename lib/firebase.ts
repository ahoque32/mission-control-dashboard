'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  doc,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
  FirestoreError,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-config';

// Import types from dedicated types file
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
  Notification,
  CronJob,
  CronJobCategory,
  SearchResult,
  SearchResultType
} from '../types';

// Re-import for local use
import type { Agent, Task, Activity, Message, Document, CronJob } from '../types';

// Export db instance for direct use
export { db };

// Default query limits to prevent unbounded data fetching
const DEFAULT_LIMITS = {
  agents: 100,
  tasks: 200,
  activities: 100,
  messages: 500,
  documents: 100
} as const;

/**
 * Categorizes Firestore errors for appropriate handling
 */
function categorizeFirestoreError(error: FirestoreError): 'permission' | 'network' | 'not-found' | 'other' {
  switch (error.code) {
    case 'permission-denied':
    case 'unauthenticated':
      return 'permission';
    case 'unavailable':
    case 'deadline-exceeded':
    case 'cancelled':
      return 'network';
    case 'not-found':
      return 'not-found';
    default:
      return 'other';
  }
}

/**
 * Creates a user-friendly error message from Firestore errors
 */
function getErrorMessage(error: FirestoreError, context: string): string {
  const category = categorizeFirestoreError(error);
  switch (category) {
    case 'permission':
      return `Access denied to ${context}. Please check your permissions.`;
    case 'network':
      return `Network error while loading ${context}. Will retry when connection is restored.`;
    case 'not-found':
      return `${context} not found.`;
    default:
      return `Error loading ${context}: ${error.message}`;
  }
}

// Ensure task documents have all required fields with safe defaults
function sanitizeTask(data: DocumentData & { id: string }): DocumentData & { id: string } {
  return {
    ...data,
    assigneeIds: Array.isArray(data.assigneeIds) ? data.assigneeIds : (data.assignedTo ? [data.assignedTo] : []),
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: data.status || 'inbox',
    priority: data.priority || 'medium',
    title: data.title || 'Untitled',
    description: data.description || '',
  };
}

// Ensure activity documents have all required fields with safe defaults
function sanitizeActivity(data: DocumentData & { id: string }): DocumentData & { id: string } {
  return {
    ...data,
    message: data.message || data.description || '',
    createdAt: data.createdAt || data.timestamp || Timestamp.now(),
    agentId: data.agentId || '',
    taskId: data.taskId || null,
    type: data.type || 'agent_task_completed',
    metadata: data.metadata || {},
  };
}

// Helper function to convert Firestore snapshot to typed array
function snapshotToArray<T>(snapshot: QuerySnapshot<DocumentData>, sanitizer?: (data: DocumentData & { id: string }) => DocumentData & { id: string }): T[] {
  return snapshot.docs.map(doc => {
    const raw = { id: doc.id, ...doc.data() };
    return sanitizer ? sanitizer(raw) : raw;
  }) as T[];
}

// Hook result type for consistency
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

// React Hooks for real-time subscriptions

/**
 * Subscribe to agents collection
 * Returns all agents sorted by name (limited to DEFAULT_LIMITS.agents)
 * 
 * Required Firestore Security Rules:
 * - Read access to 'agents' collection for authenticated users
 */
export function useAgents(): UseCollectionResult<Agent> & { agents: Agent[] } {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'agents'), 
      orderBy('name'),
      limit(DEFAULT_LIMITS.agents)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Agent>(snapshot);
        setAgents(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to agents:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'agents')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { agents, data: agents, loading, error, errorType };
}

/**
 * Subscribe to tasks collection
 * Returns all tasks sorted by updatedAt (most recent first, limited to DEFAULT_LIMITS.tasks)
 * 
 * Required Firestore Security Rules:
 * - Read access to 'tasks' collection for authenticated users
 */
export function useTasks(): UseCollectionResult<Task> & { tasks: Task[] } {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'), 
      orderBy('updatedAt', 'desc'),
      limit(DEFAULT_LIMITS.tasks)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Task>(snapshot, sanitizeTask);
        setTasks(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to tasks:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'tasks')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tasks, data: tasks, loading, error, errorType };
}

/**
 * Subscribe to activity collection
 * Returns recent activity sorted by createdAt (most recent first, limited to DEFAULT_LIMITS.activities)
 * 
 * Required Firestore Security Rules:
 * - Read access to 'activities' collection for authenticated users
 */
export function useActivity(): UseCollectionResult<Activity> & { activities: Activity[] } {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'activities'), 
      orderBy('createdAt', 'desc'),
      limit(DEFAULT_LIMITS.activities)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Activity>(snapshot, sanitizeActivity);
        setActivities(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to activities:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'activities')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { activities, data: activities, loading, error, errorType };
}

/**
 * Subscribe to messages collection
 * Returns all messages sorted by createdAt (oldest first for chat-like display, limited to DEFAULT_LIMITS.messages)
 * 
 * Required Firestore Security Rules:
 * - Read access to 'messages' collection for authenticated users
 */
export function useMessages(): UseCollectionResult<Message> & { messages: Message[] } {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'), 
      orderBy('createdAt', 'asc'),
      limit(DEFAULT_LIMITS.messages)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Message>(snapshot);
        setMessages(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to messages:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'messages')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { messages, data: messages, loading, error, errorType };
}

/**
 * Subscribe to documents collection
 * Returns all documents sorted by updatedAt (most recent first, limited to DEFAULT_LIMITS.documents)
 * 
 * Required Firestore Security Rules:
 * - Read access to 'documents' collection for authenticated users
 */
export function useDocuments(): UseCollectionResult<Document> & { documents: Document[] } {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'documents'), 
      orderBy('updatedAt', 'desc'),
      limit(DEFAULT_LIMITS.documents)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Document>(snapshot);
        setDocuments(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to documents:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'documents')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { documents, data: documents, loading, error, errorType };
}

/**
 * Subscribe to messages for a specific task (from top-level messages collection)
 * Returns messages sorted by createdAt (oldest first for chat-like display)
 * 
 * Required Firestore Security Rules:
 * - Read access to 'messages' collection where taskId matches
 * - Composite index on (taskId, createdAt)
 */
export function useTaskMessages(taskId: string | null): UseCollectionResult<Message> & { messages: Message[] } {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    if (!taskId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      setErrorType(null);
      return;
    }

    const q = query(
      collection(db, 'messages'), 
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc'),
      limit(DEFAULT_LIMITS.messages)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Message>(snapshot);
        setMessages(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to task messages:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'task messages')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { messages, data: messages, loading, error, errorType };
}

/**
 * Get a single task by ID
 * 
 * Required Firestore Security Rules:
 * - Read access to 'tasks/{taskId}' for authenticated users
 */
export function useTask(taskId: string | null): UseDocumentResult<Task> & { task: Task | null } {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      setError(null);
      setErrorType(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'tasks', taskId),
      (snapshot) => {
        if (snapshot.exists()) {
          setTask(sanitizeTask({ id: snapshot.id, ...snapshot.data() }) as Task);
        } else {
          setTask(null);
        }
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to task:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'task')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { task, data: task, loading, error, errorType };
}

/**
 * Subscribe to cron_jobs collection
 * Returns all cron jobs sorted by name
 */
export function useCronJobs(): UseCollectionResult<CronJob> & { cronJobs: CronJob[] } {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'cron_jobs'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<CronJob>(snapshot);
        setCronJobs(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to cron_jobs:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'cron jobs')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { cronJobs, data: cronJobs, loading, error, errorType };
}

/**
 * Subscribe to activities with pagination support
 * Returns activities in pages with load more capability
 */
export function useActivityPaginated(
  pageSize: number = 25,
  agentFilter?: string,
  typeFilter?: string
): UseCollectionResult<Activity> & { 
  activities: Activity[];
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
} {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'network' | 'not-found' | 'other' | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Reset when filters change
  useEffect(() => {
    setActivities([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);

    const constraints: any[] = [
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    // Note: Firestore doesn't support multiple inequality filters easily.
    // We filter client-side for simplicity since the dataset is small.
    const q = query(collection(db, 'activities'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Activity>(snapshot, sanitizeActivity);
        setActivities(data);
        setLoading(false);
        setError(null);
        setErrorType(null);
        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
        setHasMore(snapshot.docs.length >= pageSize);
      },
      (err) => {
        const firestoreError = err as FirestoreError;
        console.error('Error subscribing to activities:', firestoreError);
        const errType = categorizeFirestoreError(firestoreError);
        setError(new Error(getErrorMessage(firestoreError, 'activities')));
        setErrorType(errType);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pageSize, agentFilter, typeFilter]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const newData = snapshotToArray<Activity>(snapshot, sanitizeActivity);
      
      setActivities(prev => [...prev, ...newData]);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length >= pageSize);
    } catch (err) {
      console.error('Error loading more activities:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return { activities, data: activities, loading, error, errorType, hasMore, loadMore, loadingMore };
}
