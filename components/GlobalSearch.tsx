'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActivity, useTasks, useDocuments } from '../lib/firebase';
import { Activity, Task, Document, SearchResult } from '../types';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(timestamp: Timestamp): string {
  if (!timestamp?.toDate) return 'Unknown';
  const date = timestamp.toDate();
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-[#d4a574]/30 text-[#ededed] rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// ============================================================================
// Recent Searches
// ============================================================================

const RECENT_SEARCHES_KEY = 'mc-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const recent = getRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage might be unavailable
  }
}

// ============================================================================
// Type icons
// ============================================================================

const TYPE_ICONS: Record<string, string> = {
  task: '📋',
  activity: '📝',
  document: '📄',
};

// ============================================================================
// Component
// ============================================================================

interface GlobalSearchProps {
  /** Auto-focus search input */
  autoFocus?: boolean;
  /** Called when search is performed */
  onSearch?: (query: string) => void;
}

export default function GlobalSearch({ autoFocus = false, onSearch }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Data sources
  const { activities, loading: activitiesLoading } = useActivity();
  const { tasks, loading: tasksLoading } = useTasks();
  const { documents, loading: docsLoading } = useDocuments();

  const isLoading = activitiesLoading || tasksLoading || docsLoading;

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
        onSearch?.(query.trim());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Search logic — client-side text matching
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    const matches: SearchResult[] = [];

    // Search tasks
    tasks.forEach(task => {
      const titleMatch = task.title?.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q);
      if (titleMatch || descMatch) {
        matches.push({
          id: task.id,
          type: 'task',
          title: task.title || 'Untitled Task',
          snippet: task.description?.slice(0, 150) || '',
          timestamp: task.updatedAt || task.createdAt,
          url: `/tasks/${task.id}`,
        });
      }
    });

    // Search activities
    activities.forEach(activity => {
      const msgMatch = activity.message?.toLowerCase().includes(q);
      const typeMatch = activity.type?.toLowerCase().includes(q);
      const agentMatch = activity.agentId?.toLowerCase().includes(q);
      const metaMatch = activity.metadata?.agentName?.toLowerCase().includes(q) ||
                        activity.metadata?.taskName?.toLowerCase().includes(q);
      if (msgMatch || typeMatch || agentMatch || metaMatch) {
        matches.push({
          id: activity.id,
          type: 'activity',
          title: activity.message?.slice(0, 100) || activity.type,
          snippet: `${activity.type} • ${activity.agentId || 'unknown agent'}`,
          timestamp: activity.createdAt,
          url: '/activity',
        });
      }
    });

    // Search documents
    documents.forEach(doc => {
      const titleMatch = doc.title?.toLowerCase().includes(q);
      const contentMatch = doc.content?.toLowerCase().includes(q);
      if (titleMatch || contentMatch) {
        matches.push({
          id: doc.id,
          type: 'document',
          title: doc.title || 'Untitled Document',
          snippet: doc.content?.slice(0, 150) || '',
          timestamp: doc.updatedAt || doc.createdAt,
          url: '/documents',
        });
      }
    });

    // Sort by timestamp (most recent first)
    matches.sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return matches.slice(0, 50); // Limit results
  }, [debouncedQuery, tasks, activities, documents]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  const totalResults = results.length;

  const handleRecentClick = useCallback((search: string) => {
    setQuery(search);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-[#888] text-lg">🔍</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, activities, documents..."
          className="w-full pl-12 pr-10 py-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[#ededed] placeholder-[#666] text-lg focus:outline-none focus:border-[#d4a574]/50 focus:ring-1 focus:ring-[#d4a574]/20"
          aria-label="Search"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#888] hover:text-[#ededed]"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      {!query && (
        <div className="text-xs text-[#666] mb-6 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded text-[#888] font-mono">⌘K</kbd> from anywhere to search
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                onClick={() => handleRecentClick(search)}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#aaa] hover:border-[#d4a574]/50 hover:text-[#ededed] transition-all"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && debouncedQuery && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results Count */}
      {debouncedQuery && !isLoading && (
        <div className="text-sm text-[#888] mb-4">
          {totalResults === 0
            ? `No results for "${debouncedQuery}"`
            : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${debouncedQuery}"`}
        </div>
      )}

      {/* No Results */}
      {debouncedQuery && !isLoading && totalResults === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-[#ededed] mb-2">No results found</h3>
          <p className="text-[#888]">Try different keywords or check your spelling</p>
        </div>
      )}

      {/* Grouped Results */}
      {debouncedQuery && !isLoading && totalResults > 0 && (
        <div className="space-y-8">
          {(['task', 'activity', 'document'] as const).map(type => {
            const items = groupedResults[type];
            if (!items?.length) return null;

            const icon = TYPE_ICONS[type];
            const label = type === 'task' ? 'Tasks' : type === 'activity' ? 'Activities' : 'Documents';

            return (
              <div key={type}>
                <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{icon}</span>
                  {label}
                  <span className="text-[#666]">({items.length})</span>
                </h3>

                <div className="space-y-2">
                  {items.map(result => (
                    <Link
                      key={result.id}
                      href={result.url}
                      className="block p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#d4a574]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#ededed] mb-1 truncate">
                            {highlightMatch(result.title, debouncedQuery)}
                          </p>
                          {result.snippet && (
                            <p className="text-xs text-[#888] line-clamp-2">
                              {highlightMatch(result.snippet, debouncedQuery)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-[#666] whitespace-nowrap flex-shrink-0">
                          {formatTimestamp(result.timestamp)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
