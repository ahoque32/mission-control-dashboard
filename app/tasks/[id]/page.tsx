'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTask, useTaskMessages, useAgents } from '../../../lib/convex';

// Format relative time
function formatRelativeTime(timestamp: any | null): string {
  if (!timestamp) return 'unknown';
  const now = Date.now();
  const then = typeof timestamp === 'number' ? timestamp : (timestamp.toMillis ? timestamp.toMillis() : 0);
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Status badge colors
function getStatusColor(status: string) {
  switch (status) {
    case 'inbox': return 'bg-gray-500/20 text-gray-400';
    case 'assigned': return 'bg-blue-500/20 text-blue-400';
    case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
    case 'review': return 'bg-purple-500/20 text-purple-400';
    case 'done': case 'complete': return 'bg-green-500/20 text-green-400';
    case 'blocked': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

// Priority badge colors
function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'bg-red-500/20 text-red-400';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400';
    case 'low': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  
  const { task, loading: taskLoading, error: taskError } = useTask(taskId);
  const { messages, loading: messagesLoading } = useTaskMessages(taskId);
  const { agents } = useAgents();

  // Create agent lookup map (by id, name, sessionKey)
  const agentMap = agents.reduce((map, agent) => {
    map[agent.id] = agent;
    if (agent.name) {
      map[agent.name.toLowerCase()] = agent;
      map[agent.name] = agent;
    }
    if (agent.sessionKey) {
      map[agent.sessionKey] = agent;
      const match = agent.sessionKey.match(/^agent:([^:]+):/);
      if (match) map[match[1]] = agent;
    }
    return map;
  }, {} as Record<string, typeof agents[0]>);

  const getAgent = (agentId: string) => {
    return agentMap[agentId] || agentMap[agentId?.toLowerCase()] || null;
  };

  if (taskLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/tasks" className="text-[#d4a574] hover:underline mb-4 inline-block">
            ← Back to Tasks
          </Link>
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[#888]">Task not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link href="/tasks" className="text-[#d4a574] hover:underline mb-6 inline-block">
          ← Back to Tasks
        </Link>

        {/* Task header */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-semibold text-white">{task.title}</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status?.replace('_', ' ')}
              </span>
              {task.priority && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-[#888] mb-4">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-[#666]">
            {task.assigneeIds && task.assigneeIds.length > 0 && (
              <div>
                <span className="text-[#888]">Assigned to: </span>
                {task.assigneeIds.map((id, i) => {
                  const agent = getAgent(id);
                  return (
                    <span key={id}>
                      {i > 0 && ', '}
                      {agent?.emoji} {agent?.name || id}
                    </span>
                  );
                })}
              </div>
            )}
            {task.createdAt && (
              <div>
                <span className="text-[#888]">Created: </span>
                {formatRelativeTime(task.createdAt)}
              </div>
            )}
            {task.updatedAt && (
              <div>
                <span className="text-[#888]">Updated: </span>
                {formatRelativeTime(task.updatedAt)}
              </div>
            )}
          </div>
        </div>

        {/* Comments section */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            💬 Comments
            <span className="text-sm font-normal text-[#666]">({messages.length})</span>
          </h2>

          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-[#666]">
              <div className="text-2xl mb-2">💭</div>
              <p>No comments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const agent = getAgent(message.fromAgentId);
                return (
                  <div key={message.id} className="border-l-2 border-[#333] pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{agent?.emoji || '🤖'}</span>
                      <span className="font-medium text-[#d4a574]">
                        {agent?.name || message.fromAgentId || 'Unknown'}
                      </span>
                      <span className="text-xs text-[#666]">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                    </div>
                    <div className="text-[#ccc] whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {message.mentions && message.mentions.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {message.mentions.map((mention) => (
                          <span key={mention} className="text-xs bg-[#d4a574]/20 text-[#d4a574] px-2 py-0.5 rounded">
                            @{mention}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
