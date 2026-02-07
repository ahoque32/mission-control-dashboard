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
  DocumentData,
  QuerySnapshot,
  FirestoreError
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
  Notification
} from '../types';

// Re-import for local use
import type { Agent, Task, Activity, Message, Document } from '../types';

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

// Helper function to convert Firestore snapshot to typed array
function snapshotToArray<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
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
        const data = snapshotToArray<Task>(snapshot);
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
        const data = snapshotToArray<Activity>(snapshot);
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
          setTask({ id: snapshot.id, ...snapshot.data() } as Task);
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
