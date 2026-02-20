'use client';

import { useState, useMemo } from 'react';
import { useMemoryEntries, MemoryEntry } from '../lib/convex';
import ReactMarkdown from 'react-markdown';
import Icon from './ui/Icon';

const AGENTS = [
  { id: 'ahawk', name: 'Ahawk', emoji: '🦅', color: '#ef4444' },
  { id: 'anton', name: 'Anton', emoji: '🤖', color: '#3b82f6' },
  { id: 'dante', name: 'Dante', emoji: '🔥', color: '#8b5cf6' },
  { id: 'vincent', name: 'Vincent', emoji: '🎨', color: '#f59e0b' },
];

const ENTRY_TYPES = [
  { id: 'memory_md', label: 'Memory', icon: 'journal-text' },
  { id: 'daily_note', label: 'Daily Note', icon: 'calendar-day' },
  { id: 'soul_md', label: 'Soul', icon: 'heart' },
  { id: 'agents_md', label: 'Agents', icon: 'people' },
];

export default function MemoryBrowser() {
  const { entries, loading } = useMemoryEntries();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesAgent = selectedAgent === 'all' || entry.agentId === selectedAgent;
      const matchesType = selectedType === 'all' || entry.entryType === selectedType;
      const matchesSearch = !searchQuery || 
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesAgent && matchesType && matchesSearch;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, selectedAgent, selectedType, searchQuery]);

  const entryCounts = useMemo(() => {
    return {
      ahawk: entries.filter(e => e.agentId === 'ahawk').length,
      anton: entries.filter(e => e.agentId === 'anton').length,
      dante: entries.filter(e => e.agentId === 'dante').length,
      vincent: entries.filter(e => e.agentId === 'vincent').length,
    };
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-foreground-secondary">Loading memory entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-6">
        {/* Search */}
        <div className="glass-card p-4 rounded-xl">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Agent Filter */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-foreground mb-3">Agents</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedAgent('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedAgent === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5'
              }`}
            >
              <span>All Agents</span>
              <span className="text-xs text-foreground-muted">{entries.length}</span>
            </button>
            {AGENTS.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedAgent === agent.id ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{agent.emoji}</span>
                  <span>{agent.name}</span>
                </span>
                <span className="text-xs text-foreground-muted">{entryCounts[agent.id as keyof typeof entryCounts]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="glass-card p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-foreground mb-3">Type</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedType === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5'
              }`}
            >
              <span>All Types</span>
            </button>
            {ENTRY_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedType === type.id ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5'
                }`}
              >
                <Icon name={type.icon} size={14} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-6">
        {/* Entry List */}
        <div className={`${selectedEntry ? 'w-80' : 'flex-1'} flex-shrink-0 overflow-y-auto`}>
          <div className="space-y-2">
            {filteredEntries.map(entry => {
              const agent = AGENTS.find(a => a.id === entry.agentId);
              const type = ENTRY_TYPES.find(t => t.id === entry.entryType);
              
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full text-left glass-card p-4 rounded-xl transition-all hover:border-emerald-500/30 ${
                    selectedEntry?.id === entry.id ? 'ring-2 ring-emerald-500/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{agent?.emoji}</span>
                      <span className="font-medium text-foreground">{entry.fileName}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-foreground-secondary">
                      {type?.label}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-foreground-secondary line-clamp-2">
                    {entry.content.slice(0, 150)}...
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                    <Icon name="clock" size={12} />
                    <span>{new Date(entry.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
            
            {filteredEntries.length === 0 && (
              <div className="text-center py-12 text-foreground-secondary">
                <Icon name="journal-x" size={48} className="mx-auto mb-4 opacity-50" />
                <p>No memory entries found</p>
              </div>
            )}
          </div>
        </div>

        {/* Entry Detail */}
        {selectedEntry && (
          <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{AGENTS.find(a => a.id === selectedEntry.agentId)?.emoji}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedEntry.fileName}</h3>
                  <p className="text-xs text-foreground-secondary">{selectedEntry.filePath}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <Icon name="x-lg" size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selectedEntry.content}</ReactMarkdown>
              </div>
            </div>
            
            <div className="p-4 border-t border-border text-xs text-foreground-muted">
              Last updated: {new Date(selectedEntry.updatedAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
