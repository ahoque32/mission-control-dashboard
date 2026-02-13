'use client';

import { useState, useEffect, useCallback } from 'react';
import KimiChat from '../../components/kimi/KimiChat';
import KimiModeSelector from '../../components/kimi/KimiModeSelector';
import KimiMemoryIndicator from '../../components/kimi/KimiMemoryIndicator';
import KimiSessionIndicator from '../../components/kimi/KimiSessionIndicator';
import KimiDelegationPanel from '../../components/kimi/KimiDelegationPanel';
import type { KimiMode, KimiDelegation } from '../../lib/kimi/kimi.types';

export default function KimiPortalPage() {
  const [mode, setMode] = useState<KimiMode>('operator');
  const [profileVersion, setProfileVersion] = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  // Session state (v2)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [delegations, setDelegations] = useState<KimiDelegation[]>([]);

  // Create session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch('/api/kimi/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: 'kimi', mode }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
        }
      } catch (err) {
        console.error('Failed to create session:', err);
      }
    }
    initSession();
    // Only create session on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for delegation updates
  useEffect(() => {
    if (!sessionId) return;

    const fetchDelegations = async () => {
      try {
        const res = await fetch(`/api/kimi/delegate?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setDelegations(data.delegations || []);
        }
      } catch { /* polling failure is non-critical */ }
    };

    fetchDelegations();
    const interval = setInterval(fetchDelegations, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      // Close session via the sessions API (we'd need a close endpoint, but for now
      // we reset the client state and create a new session)
      setSessionId(null);
      setMessageCount(0);
      setDelegations([]);

      // Create a new session
      const res = await fetch('/api/kimi/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: 'kimi', mode }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [sessionId, mode]);

  const handleDelegate = useCallback(async (targetAgent: string, taskDescription: string) => {
    if (!sessionId) return;
    const res = await fetch('/api/kimi/delegate', {
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

    // Refresh delegations
    const listRes = await fetch(`/api/kimi/delegate?sessionId=${sessionId}`);
    if (listRes.ok) {
      const data = await listRes.json();
      setDelegations(data.delegations || []);
    }
  }, [sessionId]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Kimi Portal — Chief Operator
        </h1>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm text-foreground-secondary">
            Kimi K2.5
          </span>
          <span className="text-foreground-muted">·</span>
          <KimiModeSelector mode={mode} onModeChange={setMode} />
          <span className="text-foreground-muted">·</span>
          <KimiMemoryIndicator
            profileVersion={profileVersion}
            memoryCount={memoryCount}
          />
        </div>
        {/* Session indicator (v2) */}
        <KimiSessionIndicator
          sessionId={sessionId}
          mode={mode}
          messageCount={messageCount}
          onEndSession={handleEndSession}
        />
      </div>

      {/* Chat Interface */}
      <KimiChat
        mode={mode}
        sessionId={sessionId}
        onMetaUpdate={(meta: { profileVersion: string; memoryEntries: number }) => {
          setProfileVersion(meta.profileVersion);
          setMemoryCount(meta.memoryEntries);
          setMessageCount((c) => c + 1);
        }}
      />

      {/* Delegation Panel (v2) */}
      <KimiDelegationPanel
        sessionId={sessionId}
        delegations={delegations}
        onDelegate={handleDelegate}
      />
    </div>
  );
}
