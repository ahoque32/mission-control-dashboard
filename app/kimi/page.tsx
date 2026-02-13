'use client';

import { useState } from 'react';
import KimiChat from '../../components/kimi/KimiChat';
import KimiModeSelector from '../../components/kimi/KimiModeSelector';
import KimiMemoryIndicator from '../../components/kimi/KimiMemoryIndicator';
import type { KimiMode } from '../../lib/kimi/kimi.types';

export default function KimiPortalPage() {
  const [mode, setMode] = useState<KimiMode>('operator');
  const [profileVersion, setProfileVersion] = useState<string | null>(null);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Kimi Portal — Chief Operator
        </h1>
        <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {/* Chat Interface */}
      <KimiChat
        mode={mode}
        onMetaUpdate={(meta: { profileVersion: string; memoryEntries: number }) => {
          setProfileVersion(meta.profileVersion);
          setMemoryCount(meta.memoryEntries);
        }}
      />
    </div>
  );
}
