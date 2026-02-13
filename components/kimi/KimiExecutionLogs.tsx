'use client';

import { useState } from 'react';
import Icon from '../ui/Icon';

import type { KimiLogEntry } from './kimi.types';

interface KimiExecutionLogsProps {
  logs: KimiLogEntry[];
}

export default function KimiExecutionLogs({ logs }: KimiExecutionLogsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
      >
        <Icon
          name="play-fill"
          size={10}
          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
        <span>Execution Logs ({logs.length})</span>
      </button>

      {isOpen && (
        <div className="mt-2 glass-card p-3 max-h-48 overflow-y-auto">
          <div className="space-y-1 font-mono text-[11px]">
            {logs.map((log, i) => {
              const time = new Date(log.timestamp);
              const timeStr = time.toLocaleTimeString('en-US', { hour12: false });
              return (
                <div key={i} className="flex gap-2 text-foreground-secondary">
                  <span className="text-foreground-muted shrink-0">{timeStr}</span>
                  <span>{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
