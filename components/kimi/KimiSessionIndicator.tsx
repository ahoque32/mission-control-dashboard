'use client';

import Icon from '../ui/Icon';
import type { KimiMode } from '../../lib/kimi/kimi.types';

interface KimiSessionIndicatorProps {
  sessionId: string | null;
  mode: KimiMode;
  messageCount: number;
  onEndSession?: () => void;
}

export default function KimiSessionIndicator({
  sessionId,
  mode,
  messageCount,
  onEndSession,
}: KimiSessionIndicatorProps) {
  if (!sessionId) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        <span>No active session</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-foreground-secondary font-mono">
          {sessionId.slice(0, 20)}...
        </span>
      </div>

      {/* Mode badge */}
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          mode === 'operator'
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
        }`}
      >
        {mode === 'operator' ? '⚡ Operator' : '💡 Advisor'}
      </span>

      {/* Message count */}
      <span className="text-foreground-muted">
        {messageCount} msg{messageCount !== 1 ? 's' : ''}
      </span>

      {/* End session button */}
      {onEndSession && (
        <button
          onClick={onEndSession}
          className="text-foreground-muted hover:text-red-400 transition-colors"
          title="End session"
        >
          <Icon name="x-circle" size={14} />
        </button>
      )}
    </div>
  );
}
