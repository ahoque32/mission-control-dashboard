'use client';

import { useState, useMemo } from 'react';
import { useScheduledTasks, useAgents, ScheduledTask } from '../lib/convex';
import Icon from './ui/Icon';

type ViewMode = 'day' | 'week' | 'month';

const AGENT_COLORS: Record<string, string> = {
  ahawk: '#ef4444',   // Red
  anton: '#3b82f6',   // Blue
  dante: '#8b5cf6',   // Purple
  vincent: '#f59e0b', // Orange
  jhawk: '#10b981',   // Emerald
  default: '#6b7280', // Gray
};

export default function CalendarView() {
  const { tasks, loading } = useScheduledTasks();
  const { agents } = useAgents();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const agentMap = useMemo(() => {
    return agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, typeof agents[0]>);
  }, [agents]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatHeader = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric',
      ...(viewMode === 'day' && { day: 'numeric', weekday: 'long' })
    };
    return currentDate.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-foreground-secondary">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg hover:bg-white/10 text-foreground-secondary"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-lg hover:bg-white/10 text-foreground-secondary"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground">{formatHeader()}</h2>
        </div>

        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-foreground-secondary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-sm text-foreground-secondary">Agents:</span>
        {agents.map(agent => (
          <div key={agent.id} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: AGENT_COLORS[agent.name.toLowerCase()] || AGENT_COLORS.default }}
            />
            <span className="text-xs text-foreground-secondary">{agent.emoji} {agent.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 glass-card rounded-xl overflow-hidden">
        {viewMode === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            tasks={tasks} 
            agentMap={agentMap}
          />
        )}
        {viewMode === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            tasks={tasks} 
            agentMap={agentMap}
          />
        )}
        {viewMode === 'day' && (
          <DayView 
            currentDate={currentDate} 
            tasks={tasks} 
            agentMap={agentMap}
          />
        )}
      </div>
    </div>
  );
}

// Month View Component
function MonthView({ 
  currentDate, 
  tasks, 
  agentMap 
}: { 
  currentDate: Date; 
  tasks: ScheduledTask[]; 
  agentMap: Record<string, any>;
}) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = new Date();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getTasksForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      if (!task.nextRun) return false;
      return task.nextRun >= startOfDay && task.nextRun <= endOfDay;
    });
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="px-2 py-2 text-center text-sm font-medium text-foreground-secondary">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 flex-1">
        {blanks.map(i => (
          <div key={`blank-${i}`} className="border-r border-b border-border min-h-[100px]" />
        ))}
        
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          return (
            <div 
              key={day} 
              className={`border-r border-b border-border min-h-[100px] p-2 ${
                isToday(day) ? 'bg-emerald-500/5' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday(day) ? 'text-emerald-400' : 'text-foreground-secondary'
              }`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id}
                    className="text-xs px-2 py-1 rounded bg-white/5 truncate cursor-pointer hover:bg-white/10"
                    style={{ 
                      borderLeft: `3px solid ${
                        AGENT_COLORS[task.agentName?.toLowerCase() || 'default'] || AGENT_COLORS.default
                      }` 
                    }}
                    title={`${task.name} - ${task.agentName || 'Unassigned'}`}
                  >
                    {task.name}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-foreground-muted px-2">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ 
  currentDate, 
  tasks, 
  agentMap 
}: { 
  currentDate: Date; 
  tasks: ScheduledTask[]; 
  agentMap: Record<string, any>;
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const getTasksForDay = (date: Date) => {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      if (!task.nextRun) return false;
      return task.nextRun >= startOfDay && task.nextRun <= endOfDay;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day, i) => (
          <div 
            key={i} 
            className={`px-2 py-3 text-center ${isToday(day) ? 'bg-emerald-500/5' : ''}`}
          >
            <div className="text-sm text-foreground-secondary">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className={`text-lg font-semibold ${isToday(day) ? 'text-emerald-400' : 'text-foreground'}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1">
        {weekDays.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          return (
            <div 
              key={i} 
              className={`border-r border-border p-2 overflow-y-auto ${isToday(day) ? 'bg-emerald-500/5' : ''}`}
            >
              <div className="space-y-2">
                {dayTasks.map(task => (
                  <div 
                    key={task.id}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                    style={{ 
                      borderLeft: `3px solid ${
                        AGENT_COLORS[task.agentName?.toLowerCase() || 'default'] || AGENT_COLORS.default
                      }` 
                    }}
                  >
                    <div className="text-sm font-medium text-foreground">{task.name}</div>
                    {task.agentName && (
                      <div className="text-xs text-foreground-secondary mt-1">
                        {agentMap[task.agentId || '']?.emoji} {task.agentName}
                      </div>
                    )}
                    {task.nextRun && (
                      <div className="text-xs text-foreground-muted mt-1">
                        {new Date(task.nextRun).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component
function DayView({ 
  currentDate, 
  tasks, 
  agentMap 
}: { 
  currentDate: Date; 
  tasks: ScheduledTask[]; 
  agentMap: Record<string, any>;
}) {
  const startOfDay = new Date(currentDate).setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate).setHours(23, 59, 59, 999);
  
  const dayTasks = tasks.filter(task => {
    if (!task.nextRun) return false;
    return task.nextRun >= startOfDay && task.nextRun <= endOfDay;
  }).sort((a, b) => (a.nextRun || 0) - (b.nextRun || 0));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="h-full flex">
      {/* Time column */}
      <div className="w-16 border-r border-border flex-shrink-0">
        {hours.map(hour => (
          <div key={hour} className="h-16 border-b border-border/50 flex items-start justify-center pt-1">
            <span className="text-xs text-foreground-muted">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </span>
          </div>
        ))}
      </div>

      {/* Events area */}
      <div className="flex-1 relative">
        {hours.map(hour => (
          <div key={hour} className="h-16 border-b border-border/50" />
        ))}

        {dayTasks.map(task => {
          const taskDate = new Date(task.nextRun || 0);
          const hour = taskDate.getHours();
          const minute = taskDate.getMinutes();
          const top = hour * 64 + (minute / 60) * 64;

          return (
            <div
              key={task.id}
              className="absolute left-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              style={{ 
                top: `${top}px`,
                borderLeft: `3px solid ${
                  AGENT_COLORS[task.agentName?.toLowerCase() || 'default'] || AGENT_COLORS.default
                }` 
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-muted">
                  {taskDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-sm font-medium text-foreground">{task.name}</span>
              </div>
              {task.agentName && (
                <div className="text-xs text-foreground-secondary mt-1">
                  {agentMap[task.agentId || '']?.emoji} {task.agentName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
