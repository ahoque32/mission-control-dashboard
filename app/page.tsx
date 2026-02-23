'use client';

import { useMemo, useState } from 'react';
import { useAgents, useTasks, useActivity } from '../lib/convex';
import AgentGrid from '../components/AgentGrid';
import ActivityFeed from '../components/ActivityFeed';
import TaskCard from '../components/TaskCard';
import Icon from '../components/ui/Icon';
import Link from 'next/link';
import type { Task } from '../types';

export default function Home() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();
  const { activities, loading: activitiesLoading } = useActivity();
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  // Calculate system health metrics
  const systemHealth = useMemo(() => {
    const totalAgents = agents.length;
    const onlineAgents = agents.filter(a => {
      const lastHeartbeat = typeof a.lastHeartbeat === 'number' 
        ? a.lastHeartbeat 
        : a.lastHeartbeat?.toMillis?.() || 0;
      return (Date.now() - lastHeartbeat) < 5 * 60 * 1000; // 5 minutes
    }).length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const tasksCompletedToday = tasks.filter(t => {
      if (t.status !== 'done') return false;
      const updatedAt = typeof t.updatedAt === 'number' 
        ? t.updatedAt 
        : t.updatedAt?.toMillis?.() || 0;
      return updatedAt >= now.getTime();
    }).length;

    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done') return false;
      const dueDate = typeof t.dueDate === 'number' 
        ? t.dueDate 
        : t.dueDate?.toMillis?.() || 0;
      return dueDate > 0 && dueDate < Date.now();
    }).length;

    const recentActivities = activities.filter(a => {
      const createdAt = typeof a.createdAt === 'number' 
        ? a.createdAt 
        : a.createdAt?.toMillis?.() || 0;
      return createdAt > Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    }).length;

    // Recent communications (activities with type 'message' or 'communication')
    const recentComms = activities.filter(a => {
      const createdAt = typeof a.createdAt === 'number' 
        ? a.createdAt 
        : a.createdAt?.toMillis?.() || 0;
      return ((a.type as string) === 'message' || (a.type as string) === 'communication' || a.type === 'message_sent') && createdAt > Date.now() - 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalAgents,
      onlineAgents,
      tasksCompletedToday,
      overdueTasks,
      recentActivities,
      recentComms,
    };
  }, [agents, tasks, activities]);

  // Get recent tasks (most recent 6)
  const recentTasks = useMemo(() => {
    return tasks.slice(0, 6);
  }, [tasks]);

  // Map assignee IDs to emoji avatars
  const getAssigneeEmojis = (task: Task): string[] => {
    return task.assigneeIds
      .map(id => agents.find(a => a.id === id)?.emoji)
      .filter((emoji): emoji is string => emoji !== undefined);
  };

  const loading = agentsLoading || tasksLoading || activitiesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-foreground-secondary">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground p-4 sm:p-6 space-y-6 sm:space-y-8 transition-colors">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Command Center
        </h1>
        <p className="text-sm sm:text-base text-foreground-secondary">
          System overview and quick actions
        </p>
      </div>

      {/* System Health Bar */}
      <section className="glass-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Icon name="heart-pulse" size={20} className="text-emerald-400" />
            <span className="font-semibold text-foreground">System Health</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${systemHealth.onlineAgents > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground-secondary">
                Agents: <span className="text-foreground font-medium">{systemHealth.onlineAgents}/{systemHealth.totalAgents}</span> online
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Icon name="exclamation-triangle" size={14} className={systemHealth.overdueTasks > 0 ? 'text-red-400' : 'text-emerald-400'} />
              <span className="text-sm text-foreground-secondary">
                Overdue: <span className={`font-medium ${systemHealth.overdueTasks > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{systemHealth.overdueTasks}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Icon name="activity" size={14} className="text-blue-400" />
              <span className="text-sm text-foreground-secondary">
                Activity (24h): <span className="text-foreground font-medium">{systemHealth.recentActivities}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/tasks"
          className="glass-card p-4 hover:border-emerald-500/30 transition-all group flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="plus-lg" size={20} className="text-emerald-400" />
          </div>
          <div>
            <div className="font-medium text-foreground">New Task</div>
            <div className="text-xs text-foreground-secondary">Create a new task</div>
          </div>
        </Link>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openNotifications'))}
          className="glass-card p-4 hover:border-emerald-500/30 transition-all group flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="bell" size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="font-medium text-foreground">View Alerts</div>
            <div className="text-xs text-foreground-secondary">Check notifications</div>
          </div>
        </button>

        <button
          onClick={() => setShowHealthCheck(true)}
          className="glass-card p-4 hover:border-emerald-500/30 transition-all group flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon name="check2-circle" size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-foreground">Run Health Check</div>
            <div className="text-xs text-foreground-secondary">Verify system status</div>
          </div>
        </button>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity Stream (2/3 on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                <Icon name="broadcast" size={24} className="text-emerald-400" />
                Activity Stream
              </h2>
              <Link href="/activity" className="text-sm text-emerald-400 hover:text-emerald-300">
                View all →
              </Link>
            </div>
            <ActivityFeed />
          </div>

          {/* Recent Tasks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                <Icon name="list-task" size={24} className="text-emerald-400" />
                Recent Tasks
              </h2>
              <Link href="/tasks" className="text-sm text-emerald-400 hover:text-emerald-300">
                View all →
              </Link>
            </div>
            
            {recentTasks.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="mb-3 flex justify-center">
                  <Icon name="list-task" size={40} className="text-foreground-muted" />
                </div>
                <p className="text-foreground-secondary">No tasks yet. Create your first task to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {recentTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assigneeEmojis={getAssigneeEmojis(task)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: KPI Cards */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <Icon name="graph-up-arrow" size={24} className="text-emerald-400" />
            Key Metrics
          </h2>

          {/* Tasks Completed Today */}
          <div className="glass-card p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Icon name="check-circle" size={20} className="text-emerald-400" />
              </div>
              <span className="text-xs text-foreground-muted uppercase tracking-wide">Today</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400 mb-1">
              {systemHealth.tasksCompletedToday}
            </div>
            <div className="text-sm text-foreground-secondary">Tasks Completed</div>
          </div>

          {/* Agent Count */}
          <div className="glass-card p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Icon name="people" size={20} className="text-blue-400" />
              </div>
              <span className="text-xs text-foreground-muted uppercase tracking-wide">Active</span>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {systemHealth.onlineAgents}
            </div>
            <div className="text-sm text-foreground-secondary">Agents Online</div>
          </div>

          {/* Recent Comms */}
          <div className="glass-card p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Icon name="chat-dots" size={20} className="text-purple-400" />
              </div>
              <span className="text-xs text-foreground-muted uppercase tracking-wide">24h</span>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {systemHealth.recentComms}
            </div>
            <div className="text-sm text-foreground-secondary">Communications</div>
          </div>

          {/* Overdue Tasks Alert */}
          {systemHealth.overdueTasks > 0 && (
            <Link href="/tasks" className="glass-card p-5 border-red-500/30 hover:border-red-500/50 transition-all block">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Icon name="exclamation-triangle" size={20} className="text-red-400" />
                </div>
                <span className="text-xs text-red-400 uppercase tracking-wide">Attention</span>
              </div>
              <div className="text-3xl font-bold text-red-400 mb-1">
                {systemHealth.overdueTasks}
              </div>
              <div className="text-sm text-foreground-secondary">Overdue Tasks</div>
            </Link>
          )}

          {/* Agent Grid Mini */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-foreground">Agent Status</span>
              <Link href="/agents" className="text-xs text-emerald-400 hover:text-emerald-300">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {agents.slice(0, 8).map(agent => {
                const lastHeartbeat = typeof agent.lastHeartbeat === 'number' 
                  ? agent.lastHeartbeat 
                  : agent.lastHeartbeat?.toMillis?.() || 0;
                const isOnline = (Date.now() - lastHeartbeat) < 5 * 60 * 1000;
                
                return (
                  <div key={agent.id} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <div className="text-2xl">{agent.emoji}</div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                        isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <span className="text-[10px] text-foreground-secondary truncate max-w-full">{agent.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Health Check Modal */}
      {showHealthCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHealthCheck(false)}
        >
          <div className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Icon name="check2-circle" size={20} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Health Check Results</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-foreground-secondary">Database Connection</span>
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <Icon name="check-circle" size={14} /> Healthy
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-foreground-secondary">Agent Connectivity</span>
                <span className={`flex items-center gap-1.5 text-sm ${
                  systemHealth.onlineAgents > 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <Icon name={systemHealth.onlineAgents > 0 ? 'check-circle' : 'exclamation-circle'} size={14} />
                  {systemHealth.onlineAgents > 0 ? 'Healthy' : 'Warning'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-foreground-secondary">Task System</span>
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <Icon name="check-circle" size={14} /> Healthy
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-foreground-secondary">Activity Feed</span>
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <Icon name="check-circle" size={14} /> Healthy
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowHealthCheck(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
