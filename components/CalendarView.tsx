'use client';

import { useMemo, useState } from 'react';
import { useCronJobs } from '../lib/firebase';
import { CronJob, CronJobCategory } from '../types';

// ============================================================================
// Helpers
// ============================================================================

const CATEGORY_COLORS: Record<CronJobCategory, { bg: string; border: string; text: string; dot: string }> = {
  maintenance: { bg: 'bg-gray-500/15', border: 'border-gray-500/30', text: 'text-gray-300', dot: 'bg-gray-400' },
  monitoring: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  reports: { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' },
  builds: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-400' },
  security: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-300', dot: 'bg-red-400' },
  communication: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  // Monday = 1, so we need to adjust
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
  dayIndex: number; // 0=Mon, 6=Sun
  hour: number;
  minute: number;
}

function parseScheduleForWeek(job: CronJob, weekStart: Date): ScheduleOccurrence[] {
  const occurrences: ScheduleOccurrence[] = [];
  const schedule = job.schedule.toLowerCase();
  const cronExpr = job.cronExpression;

  // Parse from cronExpression: "min hour dom mon dow"
  // We support common patterns
  if (!cronExpr) return occurrences;

  const parts = cronExpr.split(/\s+/);
  if (parts.length < 5) return occurrences;

  const [minPart, hourPart, domPart, monPart, dowPart] = parts;

  // Parse minute
  const minutes = parseField(minPart, 0, 59);
  // Parse hour
  const hours = parseField(hourPart, 0, 23);
  // Parse day of week (0=Sun, 1=Mon, ... 6=Sat in cron)
  const dows = parseField(dowPart, 0, 6);

  // For each day in the week
  for (let d = 0; d < 7; d++) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + d);
    const cronDow = date.getUTCDay(); // 0=Sun in JS

    // Check if this day of week matches
    const dowMatch = dowPart === '*' || dows.includes(cronDow);
    // Check if day of month matches
    const domMatch = domPart === '*' || parseField(domPart, 1, 31).includes(date.getUTCDate());

    if (dowMatch && domMatch) {
      for (const h of hours) {
        for (const m of minutes) {
          occurrences.push({
            job,
            dayIndex: d, // 0=Mon (weekStart is Monday)
            hour: h,
            minute: m,
          });
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

  // Handle step values: */15, 0-23/2
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

  const weekStart = useMemo(() => {
    const now = new Date();
    const start = getWeekStart(now);
    start.setUTCDate(start.getUTCDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  // Compute all occurrences for this week
  const occurrences = useMemo(() => {
    if (!cronJobs.length) return [];
    const all: ScheduleOccurrence[] = [];
    cronJobs.forEach(job => {
      if (!job.enabled) return;
      const jobOccurrences = parseScheduleForWeek(job, weekStart);
      all.push(...jobOccurrences);
    });
    return all;
  }, [cronJobs, weekStart]);

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

  // Disabled jobs for legend
  const disabledJobs = cronJobs.filter(j => !j.enabled);

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
    <div>
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#d4a574]/50 text-[#ededed] text-sm"
            aria-label="Previous week"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#d4a574]/50 text-[#ededed] text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#d4a574]/50 text-[#ededed] text-sm"
            aria-label="Next week"
          >
            Next →
          </button>
        </div>
        <h2 className="text-lg font-semibold text-[#ededed]">
          {formatWeekRange(weekStart)}
        </h2>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(Object.keys(CATEGORY_COLORS) as CronJobCategory[]).map(cat => {
          const colors = CATEGORY_COLORS[cat];
          return (
            <div key={cat} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-sm ${colors.dot}`} />
              <span className="text-[#888] capitalize">{cat}</span>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-[#111]">
          <div className="p-2 border-b border-r border-[#2a2a2a]" />
          {DAYS.map((day, i) => {
            const date = new Date(weekStart);
            date.setUTCDate(date.getUTCDate() + i);
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div
                key={day}
                className={`p-2 text-center border-b border-r border-[#2a2a2a] last:border-r-0 ${isToday ? 'bg-[#d4a574]/10' : ''}`}
              >
                <div className={`text-xs font-semibold ${isToday ? 'text-[#d4a574]' : 'text-[#888]'}`}>
                  {day}
                </div>
                <div className={`text-xs mt-0.5 ${isToday ? 'text-[#d4a574]' : 'text-[#666]'}`}>
                  {formatDateShort(date)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time rows - show only hours that have events + a few key hours */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map(hour => {
            // Check if this hour has any events
            const hasEvents = DAYS.some((_, di) => grid[`${di}-${hour}`]?.length > 0);
            // Always show business hours (6-22) and hours with events
            if (!hasEvents && (hour < 4 || hour > 22)) return null;

            return (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)]">
                {/* Hour label */}
                <div className="p-1 px-2 text-xs text-[#666] font-mono border-r border-b border-[#2a2a2a] flex items-start justify-end">
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
                      className={`min-h-[40px] p-0.5 border-r border-b border-[#2a2a2a] last:border-r-0 ${isToday ? 'bg-[#d4a574]/5' : ''}`}
                    >
                      {cellOccurrences.map((occ, i) => {
                        const colors = CATEGORY_COLORS[occ.job.category] || CATEGORY_COLORS.maintenance;
                        return (
                          <div
                            key={`${occ.job.id}-${i}`}
                            className={`text-[10px] leading-tight px-1 py-0.5 rounded mb-0.5 truncate ${colors.bg} ${colors.border} border ${colors.text}`}
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

      {/* Disabled Jobs Notice */}
      {disabledJobs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Disabled Jobs</h3>
          <div className="space-y-1">
            {disabledJobs.map(job => (
              <div key={job.id} className="text-xs text-[#666] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#444]" />
                <span className="line-through">{job.name}</span>
                <span>— {job.schedule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Summary */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cronJobs.filter(j => j.enabled).map(job => {
          const colors = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.maintenance;
          return (
            <div
              key={job.id}
              className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
            >
              <div className={`text-sm font-medium ${colors.text} truncate`}>{job.name}</div>
              <div className="text-xs text-[#888] mt-1">{job.schedule}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
