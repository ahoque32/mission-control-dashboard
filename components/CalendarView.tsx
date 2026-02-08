'use client';

import { useMemo, useState } from 'react';
import { useCronJobs } from '../lib/convex';
import { CronJob, CronJobCategory } from '../types';

// ============================================================================
// Helpers
// ============================================================================

const ALL_CATEGORIES: CronJobCategory[] = [
  'maintenance', 'monitoring', 'reports', 'builds', 'security', 'communication',
];

const CATEGORY_COLORS: Record<CronJobCategory, { bg: string; border: string; text: string; dot: string; hex: string }> = {
  maintenance: { bg: 'bg-gray-400/20', border: 'border-gray-400/40', text: 'text-gray-200', dot: 'bg-gray-300', hex: '#9ca3af' },
  monitoring:  { bg: 'bg-blue-400/20', border: 'border-blue-400/40', text: 'text-blue-200', dot: 'bg-blue-400', hex: '#60a5fa' },
  reports:     { bg: 'bg-emerald-400/20', border: 'border-emerald-400/40', text: 'text-emerald-200', dot: 'bg-emerald-400', hex: '#34d399' },
  builds:      { bg: 'bg-amber-400/20', border: 'border-amber-400/40', text: 'text-amber-200', dot: 'bg-amber-400', hex: '#fbbf24' },
  security:    { bg: 'bg-rose-400/20', border: 'border-rose-400/40', text: 'text-rose-200', dot: 'bg-rose-400', hex: '#fb7185' },
  communication: { bg: 'bg-cyan-400/20', border: 'border-cyan-400/40', text: 'text-cyan-200', dot: 'bg-cyan-400', hex: '#22d3ee' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const year = weekStart.getUTCFullYear();
  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getUTCDate()} – ${weekEnd.getUTCDate()}, ${year}`;
  }
  return `${startMonth} ${weekStart.getUTCDate()} – ${endMonth} ${weekEnd.getUTCDate()}, ${year}`;
}

// ============================================================================
// Cron schedule parser — compute occurrences for a given week
// ============================================================================

interface ScheduleOccurrence {
  job: CronJob;
  dayIndex: number;
  hour: number;
  minute: number;
}

function parseScheduleForWeek(job: CronJob, weekStart: Date): ScheduleOccurrence[] {
  const occurrences: ScheduleOccurrence[] = [];
  const cronExpr = job.cronExpression;

  if (!cronExpr) return occurrences;

  const parts = cronExpr.split(/\s+/);
  if (parts.length < 5) return occurrences;

  const [minPart, hourPart, domPart, , dowPart] = parts;

  const minutes = parseField(minPart, 0, 59);
  const hours = parseField(hourPart, 0, 23);
  const dows = parseField(dowPart, 0, 6);

  for (let d = 0; d < 7; d++) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + d);
    const cronDow = date.getUTCDay();

    const dowMatch = dowPart === '*' || dows.includes(cronDow);
    const domMatch = domPart === '*' || parseField(domPart, 1, 31).includes(date.getUTCDate());

    if (dowMatch && domMatch) {
      for (const h of hours) {
        for (const m of minutes) {
          occurrences.push({ job, dayIndex: d, hour: h, minute: m });
        }
      }
    }
  }

  return occurrences;
}

function parseField(field: string, min: number, max: number): number[] {
  if (field === '*') {
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  }

  const values: number[] = [];

  field.split(',').forEach(part => {
    const stepMatch = part.match(/^(\*|\d+(?:-\d+)?)\/(\d+)$/);
    if (stepMatch) {
      const step = parseInt(stepMatch[2]);
      let start = min;
      let end = max;
      if (stepMatch[1] !== '*') {
        const rangeMatch = stepMatch[1].match(/^(\d+)(?:-(\d+))?$/);
        if (rangeMatch) {
          start = parseInt(rangeMatch[1]);
          end = rangeMatch[2] ? parseInt(rangeMatch[2]) : max;
        }
      }
      for (let i = start; i <= end; i += step) {
        values.push(i);
      }
    } else if (part.includes('-')) {
      const [s, e] = part.split('-').map(Number);
      for (let i = s; i <= e; i++) values.push(i);
    } else {
      values.push(parseInt(part));
    }
  });

  return values.filter(v => !isNaN(v) && v >= min && v <= max);
}

// ============================================================================
// Component
// ============================================================================

export default function CalendarView() {
  const { cronJobs, loading, error } = useCronJobs();
  const [weekOffset, setWeekOffset] = useState(0);
  const [enabledCategories, setEnabledCategories] = useState<Set<CronJobCategory>>(
    () => new Set(ALL_CATEGORIES)
  );
  const [disabledCollapsed, setDisabledCollapsed] = useState(true);

  // ---- Category filter helpers ----
  const toggleCategory = (cat: CronJobCategory) => {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const enableAll = () => setEnabledCategories(new Set(ALL_CATEGORIES));
  const disableAll = () => setEnabledCategories(new Set());

  const weekStart = useMemo(() => {
    const now = new Date();
    const start = getWeekStart(now);
    start.setUTCDate(start.getUTCDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  // Compute all occurrences for this week, filtered by enabled categories
  const occurrences = useMemo(() => {
    if (!cronJobs.length) return [];
    const all: ScheduleOccurrence[] = [];
    cronJobs.forEach(job => {
      if (!job.enabled) return;
      if (!enabledCategories.has(job.category)) return;
      const jobOccurrences = parseScheduleForWeek(job, weekStart);
      all.push(...jobOccurrences);
    });
    return all;
  }, [cronJobs, weekStart, enabledCategories]);

  // Build a lookup: [dayIndex][hour] => occurrences
  const grid = useMemo(() => {
    const g: Record<string, ScheduleOccurrence[]> = {};
    occurrences.forEach(occ => {
      const key = `${occ.dayIndex}-${occ.hour}`;
      if (!g[key]) g[key] = [];
      g[key].push(occ);
    });
    return g;
  }, [occurrences]);

  const disabledJobs = cronJobs.filter(j => !j.enabled);
  const enabledJobs = cronJobs.filter(j => j.enabled && enabledCategories.has(j.category));
  const allFiltered = enabledCategories.size === 0;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#888]">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm text-red-400 mb-1">Failed to load schedule</p>
          <p className="text-xs text-[#666]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Navigation Header ── */}
      <div className="flex items-center justify-between rounded-xl bg-[#1a1a1a]/70 backdrop-blur-md border border-[#2a2a2a]/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 rounded-lg bg-[#0a0a0a]/60 border border-[#2a2a2a] hover:border-[#d4a574]/60 hover:bg-[#d4a574]/10 text-[#ccc] hover:text-[#d4a574] text-sm transition-all duration-200"
            aria-label="Previous week"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-2 rounded-lg bg-[#d4a574]/10 border border-[#d4a574]/30 hover:bg-[#d4a574]/20 text-[#d4a574] text-sm font-semibold transition-all duration-200"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 rounded-lg bg-[#0a0a0a]/60 border border-[#2a2a2a] hover:border-[#d4a574]/60 hover:bg-[#d4a574]/10 text-[#ccc] hover:text-[#d4a574] text-sm transition-all duration-200"
            aria-label="Next week"
          >
            Next →
          </button>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-[#ededed]">
          {formatWeekRange(weekStart)}
        </h2>
      </div>

      {/* ── Category Filter Chips ── */}
      <div className="rounded-xl bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#2a2a2a]/50 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#888]">Categories</span>
          <div className="flex items-center gap-2">
            <button
              onClick={enableAll}
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#d4a574]/10 text-[#d4a574] hover:bg-[#d4a574]/20 border border-[#d4a574]/20 transition-all duration-200"
            >
              All
            </button>
            <button
              onClick={disableAll}
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#2a2a2a]/60 text-[#888] hover:bg-[#2a2a2a] hover:text-[#ccc] border border-[#2a2a2a] transition-all duration-200"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => {
            const colors = CATEGORY_COLORS[cat];
            const active = enabledCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-200 select-none
                  ${active
                    ? `${colors.bg} ${colors.border} ${colors.text} shadow-sm`
                    : 'bg-[#1a1a1a]/40 border-[#2a2a2a]/40 text-[#555] opacity-60 hover:opacity-80'
                  }
                `}
                aria-pressed={active}
              >
                <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${active ? colors.dot : 'bg-[#444]'}`} />
                <span className="capitalize">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Empty State ── */}
      {allFiltered && (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a]/40">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-[#888] mb-1">No categories selected</p>
          <p className="text-xs text-[#666] mb-4">Toggle some categories above to see scheduled jobs</p>
          <button
            onClick={enableAll}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#d4a574]/15 text-[#d4a574] hover:bg-[#d4a574]/25 border border-[#d4a574]/30 transition-all duration-200"
          >
            Show All Categories
          </button>
        </div>
      )}

      {/* ── Calendar Grid ── */}
      {!allFiltered && (
        <div className="border border-[#2a2a2a]/70 rounded-xl overflow-hidden shadow-lg">
          {/* Day headers */}
          <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-[#111]/80 backdrop-blur-sm">
            <div className="p-3 border-b border-r border-[#2a2a2a]/50" />
            {DAYS.map((day, i) => {
              const date = new Date(weekStart);
              date.setUTCDate(date.getUTCDate() + i);
              const isToday = new Date().toDateString() === date.toDateString();
              return (
                <div
                  key={day}
                  className={`p-3 text-center border-b border-r border-[#2a2a2a]/50 last:border-r-0 transition-colors duration-200 ${
                    isToday ? 'bg-[#d4a574]/15' : ''
                  }`}
                >
                  <div className={`text-xs font-bold tracking-wide ${isToday ? 'text-[#d4a574]' : 'text-[#999]'}`}>
                    {day}
                  </div>
                  <div className={`text-[11px] mt-1 font-medium ${isToday ? 'text-[#d4a574]' : 'text-[#555]'}`}>
                    {formatDateShort(date)}
                  </div>
                  {isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4a574] mx-auto mt-1.5 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          <div className="max-h-[600px] overflow-y-auto">
            {HOURS.map(hour => {
              const hasEvents = DAYS.some((_, di) => grid[`${di}-${hour}`]?.length > 0);
              if (!hasEvents && (hour < 4 || hour > 22)) return null;

              return (
                <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] group/row">
                  {/* Hour label */}
                  <div className="p-1.5 px-2 text-[11px] text-[#555] font-mono border-r border-b border-[#2a2a2a]/40 flex items-start justify-end group-hover/row:text-[#888] transition-colors duration-150">
                    {formatHour(hour)}
                  </div>

                  {/* Day cells */}
                  {DAYS.map((_, dayIndex) => {
                    const key = `${dayIndex}-${hour}`;
                    const cellOccurrences = grid[key] || [];
                    const date = new Date(weekStart);
                    date.setUTCDate(date.getUTCDate() + dayIndex);
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                      <div
                        key={key}
                        className={`min-h-[48px] p-1 border-r border-b border-[#2a2a2a]/30 last:border-r-0 transition-colors duration-150 hover:bg-[#1a1a1a]/50 ${
                          isToday ? 'bg-[#d4a574]/[0.03]' : ''
                        }`}
                      >
                        {cellOccurrences.map((occ, i) => {
                          const colors = CATEGORY_COLORS[occ.job.category] || CATEGORY_COLORS.maintenance;
                          return (
                            <div
                              key={`${occ.job.id}-${i}`}
                              className={`
                                text-[10px] leading-tight px-2 py-1 rounded-full mb-1 truncate
                                ${colors.bg} ${colors.border} border ${colors.text}
                                hover:shadow-md hover:shadow-current/10 hover:scale-[1.02]
                                transition-all duration-200 cursor-default
                              `}
                              title={`${occ.job.name} — ${occ.job.schedule}\n${formatHour(occ.hour)}:${String(occ.minute).padStart(2, '0')} UTC`}
                            >
                              {occ.job.name}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Disabled Jobs Accordion ── */}
      {disabledJobs.length > 0 && (
        <div className="rounded-xl border border-[#2a2a2a]/50 bg-[#0a0a0a]/40 overflow-hidden">
          <button
            onClick={() => setDisabledCollapsed(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#1a1a1a]/40 transition-colors duration-200"
          >
            <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
              Disabled Jobs ({disabledJobs.length})
            </span>
            <span className={`text-[#666] text-sm transition-transform duration-200 ${disabledCollapsed ? '' : 'rotate-180'}`}>
              ▼
            </span>
          </button>
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              disabledCollapsed ? 'max-h-0' : 'max-h-[500px]'
            }`}
          >
            <div className="px-5 pb-4 space-y-1.5">
              {disabledJobs.map(job => {
                const colors = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.maintenance;
                return (
                  <div key={job.id} className="text-xs text-[#666] flex items-center gap-2.5 py-1">
                    <span className={`w-2 h-2 rounded-full opacity-40 ${colors.dot}`} />
                    <span className="line-through opacity-70">{job.name}</span>
                    <span className="text-[#555]">— {job.schedule}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Job Summary Cards ── */}
      {enabledJobs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {enabledJobs.map(job => {
            const colors = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.maintenance;
            return (
              <div
                key={job.id}
                className={`
                  group p-4 rounded-xl border backdrop-blur-sm
                  ${colors.border} ${colors.bg}
                  bg-gradient-to-br from-transparent to-[#0a0a0a]/30
                  hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20
                  transition-all duration-250 cursor-default
                `}
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${colors.dot}`} />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${colors.text} truncate group-hover:brightness-110`}>
                      {job.name}
                    </div>
                    <div className="text-[11px] text-[#777] mt-1.5 leading-snug">{job.schedule}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
