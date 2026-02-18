'use client';

import { useState, useEffect, useMemo } from 'react';
import Icon from '../../components/ui/Icon';

interface Skill {
  name: string;
  description: string;
  category: string;
  emoji: string;
  source: 'system' | 'agent';
}

interface SkillsData {
  skills: Skill[];
  categories: string[];
  total: number;
  categoryCounts: Record<string, number>;
}

export default function SkillsPage() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let skills = data.skills;
    if (activeCategory) {
      skills = skills.filter(s => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return skills;
  }, [data, search, activeCategory]);

  const groupedSkills = useMemo(() => {
    const groups: Record<string, Skill[]> = {};
    for (const skill of filtered) {
      if (!groups[skill.category]) groups[skill.category] = [];
      groups[skill.category].push(skill);
    }
    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-foreground-secondary">Loading skills...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Failed to load skills</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Skills</h1>
          <p className="text-foreground-secondary mt-1">
            {data.total} skills installed across {data.categories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {data.total} Active
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-foreground-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !activeCategory
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-surface border border-border text-foreground-secondary hover:text-foreground hover:border-foreground/20'
            }`}
          >
            All ({data.total})
          </button>
          {data.categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-surface border border-border text-foreground-secondary hover:text-foreground hover:border-foreground/20'
              }`}
            >
              {cat} ({data.categoryCounts[cat]})
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid by Category */}
      {Object.keys(groupedSkills).length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-foreground-secondary text-lg">No skills match your search</p>
        </div>
      ) : (
        Object.entries(groupedSkills).map(([category, skills]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{category}</h2>
              <span className="text-sm text-foreground-secondary">({skills.length})</span>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(skill => (
                <div
                  key={skill.name}
                  className="glass-card p-5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{skill.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-emerald-400 transition-colors truncate">
                          {skill.name}
                        </h3>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          skill.source === 'agent'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                        }`}>
                          {skill.source === 'agent' ? 'Custom' : 'System'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-secondary mt-1.5 leading-relaxed line-clamp-3">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
