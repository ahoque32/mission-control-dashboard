'use client';

import { useState } from 'react';
import Icon from '../ui/Icon';
import type { EscalationTrigger, EscalationSeverity } from '../../lib/kimi/kimi.types';

interface KimiEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: EscalationTrigger | null;
  severity: EscalationSeverity | null;
  autoSummary: string;
  conversationId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

const SEVERITY_COLORS: Record<EscalationSeverity, string> = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const TRIGGER_LABELS: Record<EscalationTrigger, string> = {
  financial_threshold: 'Financial Threshold',
  infrastructure_change: 'Infrastructure Change',
  low_confidence: 'Low Confidence',
  user_requested: 'User Requested',
  security_sensitive: 'Security Sensitive',
  instruction_conflict: 'Instruction Conflict',
  timeout: 'Timeout',
  cross_agent_modification: 'Cross-Agent Modification',
};

export default function KimiEscalationModal({
  isOpen,
  onClose,
  trigger,
  severity,
  autoSummary,
  conversationId,
  conversationHistory,
}: KimiEscalationModalProps) {
  const [summary, setSummary] = useState(autoSummary);
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kimi/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          trigger: trigger || 'user_requested',
          summary: summary.trim(),
          userNotes: userNotes.trim() || undefined,
          conversationHistory: conversationHistory.slice(-10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit escalation');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Escalation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative glass-card p-6 w-full max-w-lg mx-4 modal-content">
        {submitted ? (
          // Success state
          <div className="text-center py-4">
            <Icon name="check-circle-fill" size={48} className="text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              Escalation Submitted
            </h3>
            <p className="text-foreground-secondary text-sm mb-6">
              JHawk will be notified. The escalation is now pending review.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20
                         rounded-xl hover:bg-emerald-500/25 transition-all font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon name="rocket-takeoff" size={20} className="text-orange-400" />
                Escalate to JHawk
              </h3>
              <button
                onClick={onClose}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <Icon name="x-circle-fill" size={20} />
              </button>
            </div>

            {/* Trigger & severity badges */}
            {trigger && severity && (
              <div className="flex gap-2 mb-4">
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-foreground-secondary font-medium">
                  {TRIGGER_LABELS[trigger]}
                </span>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${SEVERITY_COLORS[severity]}`}>
                  {severity.toUpperCase()}
                </span>
              </div>
            )}

            {/* Summary */}
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground-secondary mb-1 block">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
                           text-foreground placeholder:text-foreground-muted focus:outline-none
                           focus:ring-2 focus:ring-orange-500/50 resize-none"
                placeholder="Describe what needs JHawk's attention..."
              />
            </div>

            {/* User notes */}
            <div className="mb-6">
              <label className="text-xs font-medium text-foreground-secondary mb-1 block">
                Additional Notes (optional)
              </label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
                           text-foreground placeholder:text-foreground-muted focus:outline-none
                           focus:ring-2 focus:ring-orange-500/50 resize-none"
                placeholder="Any additional context for JHawk..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground
                           transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !summary.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/15 text-orange-400
                           border border-orange-500/20 rounded-xl hover:bg-orange-500/25
                           transition-all font-medium text-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Icon name="rocket-takeoff" size={16} />
                    Submit Escalation
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
