'use client';

import { useState } from 'react';
import Icon from '../ui/Icon';
import KimiDelegationCard from '../kimi/KimiDelegationCard';
import type { KimiDelegation } from '../../lib/kimi/kimi.types';

interface KimiAntonDelegationPanelProps {
  sessionId: string | null;
  delegations: KimiDelegation[];
  onDelegate: (targetAgent: string, taskDescription: string) => Promise<void>;
}

const AGENTS = [
  { id: 'ralph', label: '🔧 Ralph', desc: 'Code & Implementation' },
  { id: 'scout', label: '🔍 Scout', desc: 'Research & Analysis' },
  { id: 'archivist', label: '📚 Archivist', desc: 'Documentation' },
  { id: 'sentinel', label: '🛡️ Sentinel', desc: 'Monitoring & Security' },
];

export default function KimiAntonDelegationPanel({
  sessionId,
  delegations,
  onDelegate,
}: KimiAntonDelegationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetAgent, setTargetAgent] = useState('ralph');
  const [taskDesc, setTaskDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!taskDesc.trim() || !sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDelegate(targetAgent, taskDesc.trim());
      setTaskDesc('');
    } catch (err) {
      console.error('Delegation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = delegations.filter(
    (d) => d.status === 'pending' || d.status === 'in_progress'
  ).length;

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm glass-card hover:border-accent/30 transition-all w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon name="share" size={16} className="text-indigo-400" />
          <span className="text-foreground-secondary">Delegations</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
              {pendingCount} active
            </span>
          )}
        </div>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          className="text-foreground-muted"
        />
      </button>

      {isOpen && (
        <div className="mt-2 glass-card p-4 space-y-4">
          {sessionId && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                Delegate Task
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setTargetAgent(agent.id)}
                    className={`p-2 rounded-lg text-left text-xs transition-all ${
                      targetAgent === agent.id
                        ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                        : 'bg-white/5 border border-white/10 text-foreground-secondary hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">{agent.label}</div>
                    <div className="text-foreground-muted mt-0.5">{agent.desc}</div>
                  </button>
                ))}
              </div>

              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Describe the task to delegate..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm
                           text-foreground placeholder:text-foreground-muted focus:outline-none
                           focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />

              <button
                onClick={handleSubmit}
                disabled={!taskDesc.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500
                           disabled:opacity-50 rounded-lg text-white transition-colors"
              >
                <Icon name="share" size={14} />
                {isSubmitting ? 'Delegating...' : `Delegate to ${targetAgent}`}
              </button>

              <p className="text-xs text-foreground-muted">
                Model override: <code className="text-cyan-400">kimi-k2.5</code> (task-scoped only)
              </p>
            </div>
          )}

          {delegations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                Delegation History
              </h3>
              {delegations.slice(0, 10).map((d) => (
                <KimiDelegationCard key={d.delegationId} delegation={d} />
              ))}
            </div>
          )}

          {delegations.length === 0 && (
            <p className="text-xs text-foreground-muted text-center py-2">
              No delegations yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
