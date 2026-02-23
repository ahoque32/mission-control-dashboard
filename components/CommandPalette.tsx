'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './ui/Icon';

interface CommandItem {
  id: string;
  label: string;
  category: 'page' | 'agent' | 'task';
  icon: string;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allItems: CommandItem[] = [
    // Pages
    { id: 'p-dashboard', label: 'Dashboard', category: 'page', icon: 'speedometer2', action: () => router.push('/') },
    { id: 'p-tasks', label: 'Tasks', category: 'page', icon: 'kanban', action: () => router.push('/tasks') },
    { id: 'p-agents', label: 'Agents', category: 'page', icon: 'cpu', action: () => router.push('/agents') },
    { id: 'p-metrics', label: 'Metrics', category: 'page', icon: 'graph-up', action: () => router.push('/metrics') },
    { id: 'p-outbound', label: 'Outbound Pipeline', category: 'page', icon: 'funnel', action: () => router.push('/outbound') },
    { id: 'p-calls', label: 'Calls', category: 'page', icon: 'telephone', action: () => router.push('/calls') },
    { id: 'p-activity', label: 'Activity', category: 'page', icon: 'broadcast', action: () => router.push('/activity') },
    { id: 'p-calendar', label: 'Calendar', category: 'page', icon: 'calendar3', action: () => router.push('/calendar') },
    { id: 'p-chat', label: 'Agent Chat', category: 'page', icon: 'chat-dots', action: () => router.push('/chat') },
    { id: 'p-finance', label: 'Finance', category: 'page', icon: 'wallet2', action: () => router.push('/finance') },
    { id: 'p-search', label: 'Search', category: 'page', icon: 'search', action: () => router.push('/search') },
    // Agents
    { id: 'a-ralph', label: 'Ralph — Engineering Lead', category: 'agent', icon: 'person', action: () => router.push('/agents') },
    { id: 'a-dante', label: 'Dante — Fast Coder', category: 'agent', icon: 'person', action: () => router.push('/agents') },
    { id: 'a-leo', label: 'Leo — Outbound & Calls', category: 'agent', icon: 'person', action: () => router.push('/agents') },
    { id: 'a-sentinel', label: 'Sentinel — Monitoring', category: 'agent', icon: 'person', action: () => router.push('/agents') },
    { id: 'a-scout', label: 'Scout — Research', category: 'agent', icon: 'person', action: () => router.push('/agents') },
    // Tasks
    { id: 't-mc', label: 'Mission Control Enhancements', category: 'task', icon: 'list-task', action: () => router.push('/tasks') },
    { id: 't-api', label: 'API Integration Sprint', category: 'task', icon: 'list-task', action: () => router.push('/tasks') },
    { id: 't-deploy', label: 'Production Deployment', category: 'task', icon: 'list-task', action: () => router.push('/tasks') },
  ];

  const filtered = query.trim()
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const grouped = {
    page: filtered.filter(i => i.category === 'page'),
    agent: filtered.filter(i => i.category === 'agent'),
    task: filtered.filter(i => i.category === 'task'),
  };

  const flatFiltered = [...grouped.page, ...grouped.agent, ...grouped.task];

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selection on query change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  const execute = useCallback((item: CommandItem) => {
    item.action();
    setOpen(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
      e.preventDefault();
      execute(flatFiltered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!open) return null;

  const categoryLabels = { page: 'Pages', agent: 'Agents', task: 'Tasks' };
  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Icon name="search" size={20} className="text-foreground-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, agents, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-foreground placeholder:text-foreground-muted outline-none text-sm"
          />
          <kbd className="text-xs text-foreground-muted bg-white/5 px-2 py-0.5 rounded border border-border">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {flatFiltered.length === 0 && (
            <p className="text-sm text-foreground-muted text-center py-8">No results found</p>
          )}
          {(['page', 'agent', 'task'] as const).map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs text-foreground-muted uppercase tracking-wide px-3 py-1.5">{categoryLabels[cat]}</p>
                {items.map((item) => {
                  runningIndex++;
                  const idx = runningIndex;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        idx === selectedIndex ? 'bg-emerald-500/15 text-emerald-400' : 'text-foreground-secondary hover:bg-white/5'
                      }`}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <Icon name={item.icon as any} size={16} />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
