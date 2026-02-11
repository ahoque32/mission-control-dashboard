'use client';

import { useMemo } from 'react';
import { useAgents, useTasks } from '../lib/convex';
import AgentGrid from '../components/AgentGrid';
import ActivityFeed from '../components/ActivityFeed';
import TaskCard from '../components/TaskCard';
import type { Task } from '../types';

export default function Home() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();

  // Calculate task statistics by status
  const taskStats = useMemo(() => {
    const total = tasks.length;
    
    // Status-based counts
    const pending = tasks.filter(t => t.status === 'inbox' || t.status === 'assigned').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const review = tasks.filter(t => t.status === 'review').length;
    
    // Additional useful stats
    const unassigned = tasks.filter(t => t.assigneeIds.length === 0).length;
    
    // Tasks completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = tasks.filter(t => {
      if (t.status !== 'done') return false;
      const updatedAt = t.updatedAt?.toDate();
      return updatedAt && updatedAt >= today;
    }).length;

    // High priority tasks
    const highPriority = tasks.filter(t => 
      (t.priority === 'high' || t.priority === 'urgent') && 
      t.status !== 'done'
    ).length;

    return {
      total,
      pending,
      inProgress,
      done,
      blocked,
      review,
      unassigned,
      completedToday,
      highPriority
    };
  }, [tasks]);

  // Get recent tasks (most recent 10)
  const recentTasks = useMemo(() => {
    return tasks.slice(0, 10);
  }, [tasks]);

  // Map assignee IDs to emoji avatars
  const getAssigneeEmojis = (task: Task): string[] => {
    return task.assigneeIds
      .map(id => agents.find(a => a.id === id)?.emoji)
      .filter((emoji): emoji is string => emoji !== undefined);
  };

  const loading = agentsLoading || tasksLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-foreground-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground p-4 sm:p-6 space-y-6 sm:space-y-8 transition-colors">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Mission Control Dashboard
        </h1>
        <p className="text-sm sm:text-base text-foreground-secondary">
          Real-time view of agents, tasks, and activity
        </p>
      </div>

      {/* Top Section: Agent Status Cards */}
      <section className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">👥</span>
          Agent Status
        </h2>
        <AgentGrid />
      </section>

      {/* Middle Section: Activity Feed (40% left) + Task Summary Stats (60% right) */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Activity Feed - Left 40% (2 of 5 columns) */}
        <div className="lg:col-span-2">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📊</span>
            Recent Activity
          </h2>
          <ActivityFeed />
        </div>

        {/* Task Summary Statistics - Right 60% (3 of 5 columns) */}
        <div className="lg:col-span-3">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📈</span>
            Task Summary
          </h2>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Tasks */}
            <div className="glass-card p-3 sm:p-4 hover:border-emerald-500/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
                {taskStats.total}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">Total Tasks</div>
            </div>

            {/* Pending (inbox + assigned) */}
            <div className="glass-card p-3 sm:p-4 hover:border-blue-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                {taskStats.pending}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">Pending</div>
            </div>

            {/* In Progress */}
            <div className="glass-card p-3 sm:p-4 hover:border-purple-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                {taskStats.inProgress}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">In Progress</div>
            </div>

            {/* In Review */}
            <div className="glass-card p-3 sm:p-4 hover:border-yellow-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">
                {taskStats.review}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">In Review</div>
            </div>

            {/* Done */}
            <div className="glass-card p-3 sm:p-4 hover:border-emerald-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
                {taskStats.done}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">Completed</div>
            </div>

            {/* Blocked */}
            <div className="glass-card p-3 sm:p-4 hover:border-red-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">
                {taskStats.blocked}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">Blocked</div>
            </div>

            {/* Completed Today */}
            <div className="glass-card p-3 sm:p-4 hover:border-emerald-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1">
                {taskStats.completedToday}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">Done Today</div>
            </div>

            {/* High Priority */}
            <div className="glass-card p-3 sm:p-4 hover:border-red-400/30 transition-all card-hover">
              <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">
                {taskStats.highPriority}
              </div>
              <div className="text-xs sm:text-sm text-foreground-secondary">High Priority</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Recent Tasks */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">📋</span>
          Recent Tasks
        </h2>
        {recentTasks.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-foreground-secondary">No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeEmojis={getAssigneeEmojis(task)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
