'use client';

import { useMemo } from 'react';
import { useAgents, useTasks } from '../lib/firebase';
import AgentGrid from '../components/AgentGrid';
import ActivityFeed from '../components/ActivityFeed';
import TaskCard from '../components/TaskCard';
import type { Task } from '../types';

export default function Home() {
  const { agents, loading: agentsLoading } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
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
      inProgress,
      done,
      blocked,
      unassigned,
      completedToday,
      highPriority
    };
  }, [tasks]);

  // Get recent tasks (5-10 most recent)
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
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-[#ededed] text-lg animate-pulse">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-6 space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#ededed] mb-2">
          Mission Control Dashboard
        </h1>
        <p className="text-[#888]">
          Real-time view of agents, tasks, and activity
        </p>
      </div>

      {/* Top Section: Agent Status Cards */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#ededed] mb-4 flex items-center gap-2">
          <span className="text-2xl">👥</span>
          Agent Status
        </h2>
        <AgentGrid />
      </section>

      {/* Middle Section: Activity Feed (40%) + Task Stats (60%) */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Activity Feed - Left 40% */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-[#ededed] mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Recent Activity
          </h2>
          <ActivityFeed />
        </div>

        {/* Task Statistics - Right 60% */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold text-[#ededed] mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Task Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Tasks */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-[#d4a574] mb-1">
                {taskStats.total}
              </div>
              <div className="text-sm text-[#888]">Total Tasks</div>
            </div>

            {/* In Progress */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {taskStats.inProgress}
              </div>
              <div className="text-sm text-[#888]">In Progress</div>
            </div>

            {/* Completed Today */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {taskStats.completedToday}
              </div>
              <div className="text-sm text-[#888]">Done Today</div>
            </div>

            {/* High Priority */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {taskStats.highPriority}
              </div>
              <div className="text-sm text-[#888]">High Priority</div>
            </div>

            {/* Done */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {taskStats.done}
              </div>
              <div className="text-sm text-[#888]">Completed</div>
            </div>

            {/* Blocked */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-red-400 mb-1">
                {taskStats.blocked}
              </div>
              <div className="text-sm text-[#888]">Blocked</div>
            </div>

            {/* Unassigned */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-gray-400 mb-1">
                {taskStats.unassigned}
              </div>
              <div className="text-sm text-[#888]">Unassigned</div>
            </div>

            {/* Completion Rate */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-3xl font-bold text-[#d4a574] mb-1">
                {taskStats.total > 0 
                  ? Math.round((taskStats.done / taskStats.total) * 100) 
                  : 0}%
              </div>
              <div className="text-sm text-[#888]">Complete</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Recent Tasks */}
      <section>
        <h2 className="text-xl font-semibold text-[#ededed] mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Recent Tasks
        </h2>
        {recentTasks.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 text-center">
            <p className="text-[#888]">No tasks yet. Create your first task to get started!</p>
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
