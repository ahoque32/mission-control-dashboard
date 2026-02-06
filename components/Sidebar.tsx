'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgents } from '../lib/firebase';
import { AgentStatus } from '../types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Tasks', href: '/tasks', icon: '✓' },
  { label: 'Agents', href: '/agents', icon: '🤖' },
  { label: 'Documents', href: '/documents', icon: '📄' },
  { label: 'Activity', href: '/activity', icon: '📡' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { agents, loading } = useAgents();

  // Calculate agent status counts
  const agentStats = agents.reduce(
    (acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    },
    {} as Record<AgentStatus, number>
  );

  const activeCount = agentStats.active || 0;
  const totalCount = agents.length;

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <h1 className="text-2xl font-bold tracking-tight text-[#ededed]">
          Mission Control
        </h1>
        <p className="text-sm text-[#888] mt-1">Real-time Operations</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-[#d4a574]/10 text-[#d4a574] font-medium' 
                  : 'text-[#aaa] hover:bg-[#1a1a1a] hover:text-[#ededed]'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              
              {/* Agent count indicator on Agents page */}
              {item.href === '/agents' && !loading && (
                <span className={`
                  ml-auto text-xs px-2 py-0.5 rounded-full
                  ${isActive ? 'bg-[#d4a574]/20 text-[#d4a574]' : 'bg-[#2a2a2a] text-[#888]'}
                `}>
                  {totalCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status Footer */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <div className="bg-[#1a1a1a] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#888] uppercase tracking-wide">
              Agent Status
            </span>
            {loading && (
              <span className="text-xs text-[#666]">Loading...</span>
            )}
          </div>
          
          {!loading && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-green-500' : 'bg-[#444]'}`} />
                <span className="text-sm text-[#ededed]">{activeCount}</span>
              </div>
              <span className="text-xs text-[#666]">/</span>
              <span className="text-sm text-[#888]">{totalCount} total</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
