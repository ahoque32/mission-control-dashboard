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
  { label: 'Agent Chat', href: '/chat', icon: 'chat-dots' },
  { label: 'Skills', href: '/skills', icon: 'lightning-charge' },
  { label: 'Kimi Portal', href: '/kimi', icon: 'robot' },
  { label: 'Kimi Anton', href: '/kimi-anton', icon: 'robot' },
];

const v2NavItems: NavItem[] = [
  { label: 'V2 Dashboard', href: '/v2', icon: 'rocket' },
  { label: 'Tasks Board', href: '/v2/tasks', icon: 'kanban-fill' },
  { label: 'Calendar', href: '/v2/calendar', icon: 'calendar-week' },
  { label: 'Memory', href: '/v2/memory', icon: 'journal-text' },
  { label: 'Team', href: '/v2/team', icon: 'people-fill' },
  { label: 'Content', href: '/v2/content', icon: 'collection-play' },
  { label: 'Office', href: '/v2/office', icon: 'building' },
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
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

        {/* V2 Section */}
        <div className="pt-4 mt-4 border-t border-border">
          <div className="px-4 py-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Dashboard V2
          </div>
          {v2NavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm
                  ${isActive 
                    ? 'bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20' 
                    : 'text-foreground-secondary hover:bg-white/5 hover:text-foreground border border-transparent'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon name={item.icon} size={18} className={isActive ? 'text-emerald-400' : ''} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
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
