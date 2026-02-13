'use client';

import Icon from '../ui/Icon';
import type { KimiDelegation } from '../../lib/kimi/kimi.types';

interface KimiDelegationCardProps {
  delegation: KimiDelegation;
}

const STATUS_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  pending:     { icon: 'clock',          color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  claimed:     { icon: 'hand-index',     color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  in_progress: { icon: 'play-circle',    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  completed:   { icon: 'check-circle',   color: 'text-green-400',  bg: 'bg-green-500/10' },
  failed:      { icon: 'x-circle',       color: 'text-red-400',    bg: 'bg-red-500/10' },
};

const AGENT_EMOJI: Record<string, string> = {
  ralph: '🔧',
  scout: '🔍',
  archivist: '📚',
  sentinel: '🛡️',
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function KimiDelegationCard({ delegation }: KimiDelegationCardProps) {
  const style = STATUS_STYLES[delegation.status] || STATUS_STYLES.pending;

  return (
    <div className="glass-card p-3 flex items-start gap-3">
      {/* Agent avatar */}
      <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center flex-shrink-0 text-sm">
        {AGENT_EMOJI[delegation.targetAgent] || '🤖'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-foreground capitalize">
            {delegation.targetAgent}
          </span>
          <span className="text-xs text-foreground-muted">
            {formatTimeAgo(delegation.createdAt)}
          </span>
        </div>

        <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">
          {delegation.taskDescription}
        </p>

        <div className="flex items-center gap-2 mt-2">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${style.bg} ${style.color}`}>
            <Icon name={style.icon} size={10} />
            {delegation.status.replace('_', ' ')}
          </span>

          {/* Model override badge */}
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Icon name="cpu" size={10} className="inline mr-1" />
            {delegation.modelOverride}
          </span>
        </div>

        {/* Result/Error */}
        {delegation.result && (
          <div className="mt-2 p-2 bg-green-500/5 border border-green-500/20 rounded text-xs text-green-400 line-clamp-3">
            {delegation.result}
          </div>
        )}
        {delegation.error && (
          <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-xs text-red-400 line-clamp-3">
            {delegation.error}
          </div>
        )}
      </div>
    </div>
  );
}
