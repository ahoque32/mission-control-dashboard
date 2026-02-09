'use client';

import { useAgents, useTasks } from '../lib/convex';
import AgentCard from './AgentCard';

export default function AgentGrid() {
  const { agents, loading: agentsLoading, error: agentsError } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();

  // Create a map of task IDs to task titles for quick lookup
  const taskMap = new Map(tasks.map(task => [task.id, task.title]));

  // Loading state
  if (agentsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading agents">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#d4a574] border-t-transparent rounded-full animate-spin mb-3" aria-hidden="true" />
          <p className="text-[#888]">Loading agents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (agentsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold text-[#ededed] mb-2">
            Failed to load agents
          </h3>
          <p className="text-sm text-[#888]">
            {agentsError.message || 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-lg font-semibold text-[#ededed] mb-2">
            No agents found
          </h3>
          <p className="text-sm text-[#888]">
            Agents will appear here once they connect to Mission Control
          </p>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {agents.map((agent) => {
        const currentTask = agent.currentTaskId 
          ? taskMap.get(agent.currentTaskId) 
          : null;
        
        return (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            currentTask={currentTask}
          />
        );
      })}
    </div>
  );
}
