'use client';

/**
 * Header Component
 * Top bar for Mission Control dashboard
 * Displays branding, real-time agent status, user auth controls, and theme toggle
 */

import { useAgents } from '../lib/convex';
import { useAuth } from '../lib/auth-context';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { agents, loading } = useAgents();
  const { user, signOut } = useAuth();

  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalCount = agents.length;

  return (
    <header className="bg-background border-b border-border px-6 py-4 transition-colors">
      <div className="flex items-center justify-between">
        {/* Branding */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mission Control
          </h1>
          <p className="text-sm text-foreground-secondary mt-0.5">Real-time Operations</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Agent Status Indicator */}
          <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                Agents
              </span>
              
              {loading ? (
                <span className="text-xs text-foreground-muted">Loading...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-status-active' : 'bg-border-secondary'}`}
                      aria-label={`${activeCount} active agents`}
                    />
                    <span className="text-sm font-medium text-foreground">{activeCount}</span>
                  </div>
                  <span className="text-xs text-foreground-muted">/</span>
                  <span className="text-sm text-foreground-secondary">{totalCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Info + Logout */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground-secondary hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs font-medium text-foreground-secondary hover:text-foreground bg-card hover:bg-background-secondary border border-border rounded-lg transition-colors shadow-sm"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
