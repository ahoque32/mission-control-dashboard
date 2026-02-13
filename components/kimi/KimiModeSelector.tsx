'use client';

import type { KimiMode } from '../../lib/kimi/kimi.types';

interface KimiModeSelectorProps {
  mode: KimiMode;
  onModeChange: (mode: KimiMode) => void;
}

export default function KimiModeSelector({ mode, onModeChange }: KimiModeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 glass-card w-fit">
      <button
        onClick={() => onModeChange('operator')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
          mode === 'operator'
            ? 'bg-accent text-white shadow-sm'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
        }`}
      >
        ⚡ Operator
      </button>
      <button
        onClick={() => onModeChange('advisor')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
          mode === 'advisor'
            ? 'bg-accent text-white shadow-sm'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
        }`}
      >
        💡 Advisor
      </button>
      <button
        onClick={() => onModeChange('katana')}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
          mode === 'katana'
            ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
        }`}
      >
        ⚔️ Katana
      </button>
    </div>
  );
}
