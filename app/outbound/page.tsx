'use client';

import { useState } from 'react';
import Icon from '../../components/ui/Icon';

type PipelineStage = 'lead' | 'contacted' | 'responded' | 'meeting' | 'closed_won' | 'closed_lost';

interface Prospect {
  id: string;
  company: string;
  contact: string;
  lastAction: string;
  nextFollowUp: string;
  stage: PipelineStage;
}

const stages: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'border-blue-500/30' },
  { key: 'contacted', label: 'Contacted', color: 'border-amber-500/30' },
  { key: 'responded', label: 'Responded', color: 'border-purple-500/30' },
  { key: 'meeting', label: 'Meeting', color: 'border-cyan-500/30' },
  { key: 'closed_won', label: 'Closed Won', color: 'border-emerald-500/30' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'border-red-500/30' },
];

const mockProspects: Prospect[] = [
  { id: '1', company: 'Acme Corp', contact: 'Jane Smith', lastAction: 'Email sent', nextFollowUp: 'Feb 25', stage: 'contacted' },
  { id: '2', company: 'TechFlow Inc', contact: 'Mike Chen', lastAction: 'Demo scheduled', nextFollowUp: 'Feb 24', stage: 'meeting' },
  { id: '3', company: 'DataSync Ltd', contact: 'Sarah Lee', lastAction: 'Inbound inquiry', nextFollowUp: 'Feb 23', stage: 'lead' },
  { id: '4', company: 'CloudScale', contact: 'Tom Harris', lastAction: 'Replied to email', nextFollowUp: 'Feb 26', stage: 'responded' },
  { id: '5', company: 'NovaTech', contact: 'Lisa Wang', lastAction: 'Contract signed', nextFollowUp: '—', stage: 'closed_won' },
  { id: '6', company: 'Orbital AI', contact: 'James Park', lastAction: 'No budget', nextFollowUp: '—', stage: 'closed_lost' },
  { id: '7', company: 'Vertex Labs', contact: 'Anna Kowalski', lastAction: 'Cold email', nextFollowUp: 'Feb 27', stage: 'lead' },
  { id: '8', company: 'PipelinePro', contact: 'Dan Murphy', lastAction: 'Follow-up call', nextFollowUp: 'Feb 28', stage: 'contacted' },
  { id: '9', company: 'QuantumBit', contact: 'Priya Nair', lastAction: 'Proposal sent', nextFollowUp: 'Mar 1', stage: 'responded' },
];

export default function OutboundPage() {
  const [prospects] = useState<Prospect[]>(mockProspects);

  const totalProspects = prospects.length;
  const responseRate = Math.round((prospects.filter(p => !['lead', 'contacted'].includes(p.stage)).length / totalProspects) * 100);
  const meetingsBooked = prospects.filter(p => p.stage === 'meeting').length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Outbound Pipeline</h1>
        <p className="text-foreground-secondary mt-1">Prospect tracking & pipeline management</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Prospects', value: totalProspects, icon: 'people' },
          { label: 'Response Rate', value: `${responseRate}%`, icon: 'chat-left-text' },
          { label: 'Meetings Booked', value: meetingsBooked, icon: 'calendar-check' },
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

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageProspects = prospects.filter(p => p.stage === stage.key);
          return (
            <div key={stage.key} className="min-w-[260px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{stage.label}</h3>
                <span className="text-xs bg-white/10 text-foreground-secondary px-2 py-0.5 rounded-full">
                  {stageProspects.length}
                </span>
              </div>
              <div className="space-y-3">
                {stageProspects.map((prospect) => (
                  <div
                    key={prospect.id}
                    className={`glass-card p-4 border-l-2 ${stage.color} hover:border-emerald-500/40 transition-all cursor-pointer`}
                  >
                    <h4 className="text-sm font-semibold text-foreground">{prospect.company}</h4>
                    <p className="text-xs text-foreground-secondary mt-1">{prospect.contact}</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground-muted">Last Action</span>
                        <span className="text-foreground-secondary">{prospect.lastAction}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground-muted">Follow-up</span>
                        <span className="text-foreground-secondary">{prospect.nextFollowUp}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {stageProspects.length === 0 && (
                  <div className="glass-card p-4 text-center">
                    <p className="text-xs text-foreground-muted">No prospects</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
