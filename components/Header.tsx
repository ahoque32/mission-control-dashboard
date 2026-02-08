'use client';

/**
 * Header Component
 * Top bar for Mission Control dashboard
 * Displays branding and real-time agent status
 */

import { useAgents } from '../lib/convex';

export default function Header() {
  const { agents, loading } = useAgents();

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalCount = agents.length;

  return (
    <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Branding */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ededed]">
            Mission Control
          </h1>
          <p className="text-sm text-[#888] mt-0.5">Real-time Operations</p>
        </div>

        {/* Agent Status Indicator */}
        <div className="bg-[#1a1a1a] rounded-lg px-4 py-2 border border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#888] uppercase tracking-wide">
              Agents
            </span>
            
            {loading ? (
              <span className="text-xs text-[#666]">Loading...</span>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div 
                    className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-green-500' : 'bg-[#444]'}`}
                    aria-label={`${activeCount} active agents`}
                  />
                  <span className="text-sm font-medium text-[#ededed]">{activeCount}</span>
                </div>
                <span className="text-xs text-[#666]">/</span>
                <span className="text-sm text-[#888]">{totalCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
