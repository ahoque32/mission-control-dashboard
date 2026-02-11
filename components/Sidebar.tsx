'use client';

/**
 * Sidebar Component
 * Main navigation sidebar for desktop view
 * Features:
 * - Glassmorphism design
 * - Active route highlighting with emerald accent
 * - Real-time agent status
 * - Responsive design (hidden on mobile)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgents } from '../lib/convex';
import { AgentStatus } from '../types';
import ThemeToggle from './ThemeToggle';
import Icon from './ui/Icon';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'speedometer2' },
  { label: 'Tasks', href: '/tasks', icon: 'kanban' },
  { label: 'Agents', href: '/agents', icon: 'cpu' },
  { label: 'Activity', href: '/activity', icon: 'broadcast' },
  { label: 'Documents', href: '/documents', icon: 'file-text' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar3' },
  { label: 'Search', href: '/search', icon: 'search' },
  { label: 'Finance', href: '/finance', icon: 'wallet2' },
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
    <aside className="w-64 glass-sidebar border-r border-border flex flex-col h-screen sticky top-0 transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mission Control
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-foreground-secondary mt-1">Real-time Operations</p>
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
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? 'bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20' 
                  : 'text-foreground-secondary hover:bg-white/5 hover:text-foreground border border-transparent'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={item.icon} size={20} className={isActive ? 'text-emerald-400' : ''} />
              <span>{item.label}</span>
              
              {/* Agent count indicator on Agents page */}
              {item.href === '/agents' && !loading && (
                <span className={`
                  ml-auto text-xs px-2 py-0.5 rounded-full
                  ${isActive 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-white/5 text-foreground-secondary'
                  }
                `}>
                  {totalCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status Footer */}
      <div className="p-4 border-t border-border">
        <div className="glass-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
              Agent Status
            </span>
            {loading && (
              <span className="text-xs text-foreground-muted">Loading...</span>
            )}
          </div>
          
          {!loading && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div 
                  className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-border-secondary'}`}
                  aria-label={`${activeCount} active agents`}
                />
                <span className="text-sm text-foreground">{activeCount}</span>
              </div>
              <span className="text-xs text-foreground-muted">/</span>
              <span className="text-sm text-foreground-secondary">{totalCount} total</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
