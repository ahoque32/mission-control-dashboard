'use client';

import { useState } from 'react';
import Icon from '../../components/ui/Icon';

interface CallRecord {
  id: string;
  date: string;
  contact: string;
  company: string;
  duration: string;
  durationSec: number;
  status: 'completed' | 'missed' | 'voicemail' | 'in-progress';
  sentiment: 'positive' | 'neutral' | 'negative';
  agent: string;
  transcript: string;
}

const mockCalls: CallRecord[] = [
  { id: '1', date: '2026-02-23 09:15', contact: 'Jane Smith', company: 'Acme Corp', duration: '4:32', durationSec: 272, status: 'completed', sentiment: 'positive', agent: 'Leo', transcript: 'Great conversation about their Q2 expansion plans. They\'re interested in our enterprise tier and want to schedule a deeper technical demo with their CTO next week. Key concerns: data residency requirements and SOC2 compliance.' },
  { id: '2', date: '2026-02-23 10:00', contact: 'Mike Chen', company: 'TechFlow Inc', duration: '2:15', durationSec: 135, status: 'completed', sentiment: 'neutral', agent: 'Leo', transcript: 'Follow-up on the proposal sent last week. Mike mentioned they\'re still evaluating two other vendors. Need to send comparison sheet and case studies by Friday.' },
  { id: '3', date: '2026-02-23 11:30', contact: 'Sarah Lee', company: 'DataSync Ltd', duration: '0:00', durationSec: 0, status: 'missed', sentiment: 'neutral', agent: 'Scout', transcript: 'Call was not connected. Voicemail was not available.' },
  { id: '4', date: '2026-02-22 14:20', contact: 'Tom Harris', company: 'CloudScale', duration: '6:48', durationSec: 408, status: 'completed', sentiment: 'positive', agent: 'Leo', transcript: 'Tom is very enthusiastic about the integration capabilities. Discussed API rate limits and webhook reliability. He wants to start a pilot with 5 users next month.' },
  { id: '5', date: '2026-02-22 15:45', contact: 'Lisa Wang', company: 'NovaTech', duration: '1:10', durationSec: 70, status: 'voicemail', sentiment: 'neutral', agent: 'Scout', transcript: 'Left voicemail regarding contract renewal discussion. Mentioned the 15% volume discount for annual commitment.' },
  { id: '6', date: '2026-02-22 16:30', contact: 'James Park', company: 'Orbital AI', duration: '3:22', durationSec: 202, status: 'completed', sentiment: 'negative', agent: 'Leo', transcript: 'James informed us they\'re going with a competitor due to budget constraints. Their budget was cut by 40% in Q1. Offered to revisit in Q3 when their new funding round closes.' },
  { id: '7', date: '2026-02-21 09:00', contact: 'Anna Kowalski', company: 'Vertex Labs', duration: '5:15', durationSec: 315, status: 'completed', sentiment: 'positive', agent: 'Leo', transcript: 'Excellent discovery call. Anna is the head of engineering and has authority to make purchasing decisions. They need a solution by end of March. Sending proposal tomorrow.' },
];

const statusConfig = {
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
  missed: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Missed' },
  voicemail: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Voicemail' },
  'in-progress': { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
};

const sentimentConfig = {
  positive: { color: 'text-emerald-400', icon: 'emoji-smile' },
  neutral: { color: 'text-foreground-muted', icon: 'emoji-neutral' },
  negative: { color: 'text-red-400', icon: 'emoji-frown' },
};

export default function CallsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalCalls = mockCalls.length;
  const avgDuration = Math.round(mockCalls.filter(c => c.durationSec > 0).reduce((s, c) => s + c.durationSec, 0) / mockCalls.filter(c => c.durationSec > 0).length);
  const avgDurationStr = `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, '0')}`;
  const successRate = Math.round((mockCalls.filter(c => c.status === 'completed').length / totalCalls) * 100);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calls</h1>
        <p className="text-foreground-secondary mt-1">Call log & conversation insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Calls', value: totalCalls, icon: 'telephone' },
          { label: 'Avg Duration', value: avgDurationStr, icon: 'clock' },
          { label: 'Success Rate', value: `${successRate}%`, icon: 'graph-up' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <Icon name={stat.icon as any} size={20} className="text-emerald-400" />
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wide">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Call Log Table */}
      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[140px_1fr_1fr_80px_90px_80px_70px] gap-2 px-5 py-3 border-b border-border text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          <span>Date</span>
          <span>Contact</span>
          <span>Company</span>
          <span>Duration</span>
          <span>Status</span>
          <span>Sentiment</span>
          <span>Agent</span>
        </div>

        {/* Rows */}
        {mockCalls.map((call) => {
          const status = statusConfig[call.status];
          const sentiment = sentimentConfig[call.sentiment];
          const isExpanded = expandedId === call.id;

          return (
            <div key={call.id}>
              <div
                className="grid grid-cols-[140px_1fr_1fr_80px_90px_80px_70px] gap-2 px-5 py-3 border-b border-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors items-center"
                onClick={() => setExpandedId(isExpanded ? null : call.id)}
              >
                <span className="text-xs text-foreground-secondary font-mono">{call.date}</span>
                <span className="text-sm text-foreground">{call.contact}</span>
                <span className="text-sm text-foreground-secondary">{call.company}</span>
                <span className="text-sm text-foreground font-mono">{call.duration}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block w-fit ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                <span className={sentiment.color}>
                  <Icon name={sentiment.icon as any} size={18} />
                </span>
                <span className="text-sm text-foreground-secondary">{call.agent}</span>
              </div>

              {/* Expandable Transcript */}
              {isExpanded && (
                <div className="px-5 py-4 bg-white/[0.02] border-b border-border/50">
                  <p className="text-xs text-foreground-muted uppercase tracking-wide mb-2">Transcript Preview</p>
                  <p className="text-sm text-foreground-secondary leading-relaxed">{call.transcript}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
