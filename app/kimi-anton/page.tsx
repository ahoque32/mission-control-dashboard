'use client';

import { useState, useEffect, useCallback } from 'react';
import KimiAntonChat from '../../components/kimi-anton/KimiAntonChat';
import KimiModeSelector from '../../components/kimi/KimiModeSelector';
import KimiAntonMemoryIndicator from '../../components/kimi-anton/KimiAntonMemoryIndicator';
import KimiSessionIndicator from '../../components/kimi/KimiSessionIndicator';
import KimiAntonDelegationPanel from '../../components/kimi-anton/KimiAntonDelegationPanel';
import type { KimiMode, KimiDelegation } from '../../lib/kimi-anton/kimi.types';

export default function KimiPortalAntonPage() {
  const [mode, setMode] = useState<KimiMode>('operator');
  const [profileVersion, setProfileVersion] = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [delegations, setDelegations] = useState<KimiDelegation[]>([]);

  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch('/api/kimi-anton/sessions', {
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

      const res = await fetch('/api/kimi-anton/sessions', {
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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Kimi Portal — Anton (Commander)
        </h1>
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
