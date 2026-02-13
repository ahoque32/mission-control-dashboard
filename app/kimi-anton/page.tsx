'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import KimiAntonChat from '../../components/kimi-anton/KimiAntonChat';
import KimiModeSelector from '../../components/kimi/KimiModeSelector';
import KimiAntonMemoryIndicator from '../../components/kimi-anton/KimiAntonMemoryIndicator';
import KimiSessionIndicator from '../../components/kimi/KimiSessionIndicator';
import KimiAntonDelegationPanel from '../../components/kimi-anton/KimiAntonDelegationPanel';
import Icon from '../../components/ui/Icon';
import type { KimiMode, KimiDelegation } from '../../lib/kimi-anton/kimi.types';

const CONVO_ID_KEY = 'kimi-anton-conversationId';
const SESSION_ID_KEY = 'kimi-anton-sessionId';

function getOrCreateConversationId(): string {
  if (typeof window === 'undefined') return `convo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const existing = localStorage.getItem(CONVO_ID_KEY);
  if (existing) return existing;
  const id = `convo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(CONVO_ID_KEY, id);
  return id;
}

export default function KimiPortalAntonPage() {
  const [mode, setMode] = useState<KimiMode>('operator');
  const [profileVersion, setProfileVersion] = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState<number>(0);
  const [conversationId, setConversationId] = useState<string>(() => getOrCreateConversationId());

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [delegations, setDelegations] = useState<KimiDelegation[]>([]);

  // Check if conversation is stale (>5 days) and rotate if needed
  const isStale = useQuery(api.kimiChatMessages.isConversationStale, { sessionId: conversationId });
  const clearOldMessages = useMutation(api.kimiChatMessages.clearOldMessages);
  const clearAllStale = useMutation(api.kimiChatMessages.clearAllStaleConversations);

  useEffect(() => {
    clearAllStale({}).catch(() => {});
  }, [clearAllStale]);

  useEffect(() => {
    if (isStale === true) {
      clearOldMessages({ sessionId: conversationId }).catch(() => {});
      const newId = `convo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(CONVO_ID_KEY, newId);
      setConversationId(newId);
    }
  }, [isStale, conversationId, clearOldMessages]);

  // Resume or create session on mount
  useEffect(() => {
    async function initSession() {
      try {
        // Try to resume existing session from localStorage
        const savedSessionId = typeof window !== 'undefined'
          ? localStorage.getItem(SESSION_ID_KEY)
          : null;

        if (savedSessionId) {
          // Verify it's still active
          const checkRes = await fetch(`/api/kimi-anton/sessions?owner=kimi&status=active`);
          if (checkRes.ok) {
            const { sessions } = await checkRes.json();
            const active = sessions?.find((s: { sessionId: string }) => s.sessionId === savedSessionId);
            if (active) {
              setSessionId(savedSessionId);
              setMessageCount(active.messageCount || 0);
              return;
            }
          }
        }

        // No valid session — create a new one
        const res = await fetch('/api/kimi-anton/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: 'kimi', mode }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
          localStorage.setItem(SESSION_ID_KEY, data.sessionId);
        }
      } catch (err) {
        console.error('Failed to init session:', err);
      }
    }
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const fetchDelegations = async () => {
      try {
        const res = await fetch(`/api/kimi-anton/delegate?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setDelegations(data.delegations || []);
        }
      } catch { /* polling failure is non-critical */ }
    };

    fetchDelegations();
    const interval = setInterval(fetchDelegations, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await fetch('/api/kimi-anton/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'close' }),
      });

      setSessionId(null);
      setMessageCount(0);
      setDelegations([]);
      localStorage.removeItem(SESSION_ID_KEY);

      // Rotate conversation ID (fresh chat)
      const newConvoId = `convo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(CONVO_ID_KEY, newConvoId);
      setConversationId(newConvoId);

      const res = await fetch('/api/kimi-anton/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: 'kimi', mode }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
      }
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [sessionId, mode]);

  const handleDelegate = useCallback(async (targetAgent: string, taskDescription: string) => {
    if (!sessionId) return;
    const res = await fetch('/api/kimi-anton/delegate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        callerAgent: 'kimi',
        targetAgent,
        taskDescription,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Delegation failed');
    }

    const listRes = await fetch(`/api/kimi-anton/delegate?sessionId=${sessionId}`);
    if (listRes.ok) {
      const data = await listRes.json();
      setDelegations(data.delegations || []);
    }
  }, [sessionId]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Kimi Portal — Anton (Commander)
          </h1>
          <button
            onClick={handleEndSession}
            title="New Chat"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       bg-white/5 border border-white/10 rounded-lg
                       hover:bg-white/10 hover:border-white/20 transition-all
                       text-foreground-secondary hover:text-foreground"
          >
            <Icon name="pencil-square" size={14} />
            New Chat
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm text-foreground-secondary">
            Kimi K2.5
          </span>
          <span className="text-foreground-muted">·</span>
          <KimiModeSelector mode={mode} onModeChange={setMode} />
          <span className="text-foreground-muted">·</span>
          <KimiAntonMemoryIndicator
            profileVersion={profileVersion}
            memoryCount={memoryCount}
          />
        </div>
        <KimiSessionIndicator
          sessionId={sessionId}
          mode={mode}
          messageCount={messageCount}
          onEndSession={handleEndSession}
        />
      </div>

      {/* Chat Interface */}
      <KimiAntonChat
        mode={mode}
        sessionId={sessionId}
        conversationId={conversationId}
        onMetaUpdate={(meta: { profileVersion: string; memoryEntries: number }) => {
          setProfileVersion(meta.profileVersion);
          setMemoryCount(meta.memoryEntries);
          setMessageCount((c) => c + 1);
        }}
      />

      {/* Delegation Panel */}
      <KimiAntonDelegationPanel
        sessionId={sessionId}
        delegations={delegations}
        onDelegate={handleDelegate}
      />
    </div>
  );
}
