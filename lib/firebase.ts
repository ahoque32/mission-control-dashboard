'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  DocumentData,
  QuerySnapshot 
} from 'firebase/firestore';
import { db } from './firebase-config';

// Import types from dedicated types file
export type {
  Agent,
  AgentStatus,
  AgentLevel,
  Task,
  TaskStatus,
  Priority,
  Message,
  Activity,
  ActivityType,
  Document,
  DocumentType,
  Notification
} from '../types';

// Re-import for local use
import type { Agent, Task, Activity, Message } from '../types';

// Export db instance for direct use
export { db };

// Helper function to convert Firestore snapshot to typed array
function snapshotToArray<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
}

// React Hooks for real-time subscriptions

/**
 * Subscribe to agents collection
 * Returns all agents sorted by name
 */
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'agents'), orderBy('name'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Agent>(snapshot);
        setAgents(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to agents:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { agents, loading, error };
}

/**
 * Subscribe to tasks collection
 * Returns all tasks sorted by updatedAt (most recent first)
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Task>(snapshot);
        setTasks(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to tasks:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tasks, loading, error };
}

/**
 * Subscribe to activity collection
 * Returns recent activity sorted by createdAt (most recent first)
 */
export function useActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Activity>(snapshot);
        setActivities(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to activities:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { activities, loading, error };
}

/**
 * Subscribe to messages collection
 * Returns all messages sorted by createdAt (oldest first for chat-like display)
 */
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Message>(snapshot);
        setMessages(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to messages:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { messages, loading, error };
}

// Import Document type for the hook
import type { Document } from '../types';

/**
 * Subscribe to documents collection
 * Returns all documents sorted by updatedAt (most recent first)
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Document>(snapshot);
        setDocuments(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to documents:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { documents, loading, error };
}

/**
 * Subscribe to messages subcollection for a specific task
 * Returns messages sorted by createdAt (oldest first for chat-like display)
 */
export function useTaskMessages(taskId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!taskId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks', taskId, 'messages'), 
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshotToArray<Message>(snapshot);
        setMessages(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to task messages:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { messages, loading, error };
}
