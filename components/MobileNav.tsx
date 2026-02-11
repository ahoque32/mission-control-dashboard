'use client';

/**
 * MobileNav Component
 * Mobile-responsive navigation with hamburger menu
 * Features:
 * - Collapsible sidebar
 * - Touch-friendly navigation
 * - Agent status indicator
 * - Theme toggle
 * - Overlay backdrop
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAgents } from '../lib/convex';
import ThemeToggle from './ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Tasks', href: '/tasks', icon: '✓' },
  { label: 'Agents', href: '/agents', icon: '🤖' },
  { label: 'Activity', href: '/activity', icon: '📡' },
  { label: 'Documents', href: '/documents', icon: '📄' },
  { label: 'Calendar', href: '/calendar', icon: '📅' },
  { label: 'Search', href: '/search', icon: '🔍' },
  { label: 'Finance', href: '/finance', icon: '💰' },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { agents, loading } = useAgents();

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalCount = agents.length;

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden glass-nav border-b border-border sticky top-0 z-50 transition-colors">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Mission Control</h1>
            <p className="text-xs text-foreground-secondary">Real-time Operations</p>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground p-3 hover:bg-background-secondary rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-menu"
            >
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 modal-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          <div 
            id="mobile-nav-menu"
            className="lg:hidden fixed top-[89px] left-0 right-0 bottom-0 glass-nav z-40 overflow-y-auto modal-content transition-colors"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <nav className="p-4 space-y-1" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-accent/10 text-accent font-medium shadow-sm' 
                        : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                    
                    {item.href === '/agents' && !loading && (
                      <span className={`
                        ml-auto text-xs px-2 py-0.5 rounded-full
                        ${isActive 
                          ? 'bg-accent/20 text-accent' 
                          : 'bg-background-secondary text-foreground-secondary'
                        }
                      `}>
                        {totalCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Agent Status in Mobile */}
            <div className="p-4 border-t border-border mt-4">
              <div className="glass-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                    Agent Status
                  </span>
                </div>
                
                {!loading && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div 
                        className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-status-active' : 'bg-border-secondary'}`}
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
          </div>
        </>
      )}
    </>
  );
}
