'use client';

import { Task, Agent, Message, TaskPriority, TaskStatus } from '../types';
type Priority = TaskPriority;
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import TaskComments from './TaskComments';

interface TaskDetailProps {
  task: Task;
  agents: Agent[]; // All agents for lookup
  messages: Message[]; // Comments for this task
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

// Priority badge colors (consistent with TaskCard)
const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Low' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Medium' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'High' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Urgent' }
};

// Status colors and labels
const STATUS_INFO: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  inbox: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Inbox' },
  assigned: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Assigned' },
  in_progress: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'In Progress' },
  review: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Review' },
  done: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Done' },
  blocked: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Blocked' }
};

// Available status transitions
const STATUS_TRANSITIONS: TaskStatus[] = ['inbox', 'assigned', 'in_progress', 'review', 'done', 'blocked'];

export default function TaskDetail({ 
  task, 
  agents, 
  messages, 
  isOpen, 
  onClose,
  onStatusChange 
}: TaskDetailProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Don't render if not open
  if (!isOpen) return null;

  // Get assignees from agent list
  const assignees = agents.filter(agent => task.assigneeIds.includes(agent.id));

  // Get creator
  const creator = agents.find(agent => agent.id === task.createdBy);

  // Sort messages by creation time
  const getMs = (ts: any) => typeof ts === 'number' ? ts : (ts?.toMillis ? ts.toMillis() : 0);
  const sortedMessages = [...messages].sort((a, b) => 
    getMs(a.createdAt) - getMs(b.createdAt)
  );

  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const statusStyle = STATUS_INFO[task.status];

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
    setShowStatusMenu(false);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(typeof timestamp === 'number' ? timestamp : 0);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        <div 
          className="
            bg-[#0a0a0a] border border-[#2a2a2a] rounded-t-xl sm:rounded-xl
            w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh]
            flex flex-col
            shadow-2xl shadow-[#d4a574]/20
            modal-content
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-[#2a2a2a] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              {/* Title & Badges */}
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#ededed] mb-3">
                  {task.title}
                </h2>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusMenu(!showStatusMenu)}
                      className={`
                        text-sm font-medium px-3 py-1.5 rounded
                        ${statusStyle.bg} ${statusStyle.text}
                        hover:opacity-80 transition-opacity
                        flex items-center gap-2
                      `}
                    >
                      {statusStyle.label}
                      <span className="text-xs">▼</span>
                    </button>

                    {/* Status dropdown */}
                    {showStatusMenu && (
                      <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-10 min-w-[140px]">
                        {STATUS_TRANSITIONS.map(status => {
                          const style = STATUS_INFO[status];
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className={`
                                w-full text-left px-3 py-2 text-sm
                                ${style.text}
                                hover:bg-[#2a2a2a]
                                transition-colors
                                ${status === task.status ? 'font-bold' : ''}
                              `}
                            >
                              {style.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Priority Badge */}
                  <span 
                    className={`
                      text-sm font-medium px-3 py-1.5 rounded
                      ${priorityStyle.bg} ${priorityStyle.text}
                    `}
                  >
                    {priorityStyle.label}
                  </span>

                  {/* Due Date */}
                  {task.dueDate && (
                    <span className="text-sm text-[#888] px-3 py-1.5">
                      Due: {(task.dueDate as any).toDate ? (task.dueDate as any).toDate().toLocaleDateString() : new Date(task.dueDate as any).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close task details"
                className="
                  text-[#888] hover:text-[#ededed]
                  text-2xl leading-none
                  w-11 h-11 flex items-center justify-center
                  hover:bg-[#2a2a2a] rounded-lg
                  transition-colors
                "
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Assignees Section */}
            {assignees.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#d4a574] mb-2">
                  Assigned To
                </h3>
                <div className="flex flex-wrap gap-2">
                  {assignees.map(agent => (
                    <div
                      key={agent.id}
                      className="
                        flex items-center gap-2
                        bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg
                        px-3 py-2
                      "
                    >
                      <span className="text-lg">{agent.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-[#ededed]">
                          {agent.name}
                        </div>
                        <div className="text-xs text-[#888]">
                          {agent.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#d4a574] mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="
                        text-xs px-2 py-1 rounded
                        bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]
                      "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description Section */}
            {task.description && (
              <div>
                <h3 className="text-sm font-semibold text-[#d4a574] mb-2">
                  Description
                </h3>
                <div 
                  className="
                    prose prose-invert prose-sm max-w-none
                    text-[#ededed]
                    bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg
                    p-4
                  "
                >
                  <ReactMarkdown
                    components={{
                      // Style markdown elements to match dark theme
                      h1: (props) => <h1 className="text-xl font-bold text-[#ededed] mb-2" {...props} />,
                      h2: (props) => <h2 className="text-lg font-bold text-[#ededed] mb-2" {...props} />,
                      h3: (props) => <h3 className="text-base font-bold text-[#ededed] mb-2" {...props} />,
                      p: (props) => <p className="text-[#ededed] mb-2" {...props} />,
                      a: (props) => <a className="text-[#d4a574] hover:underline" {...props} />,
                      code: (props) => <code className="bg-[#0a0a0a] text-[#d4a574] px-1 rounded" {...props} />,
                      pre: (props) => <pre className="bg-[#0a0a0a] p-3 rounded overflow-x-auto" {...props} />,
                      ul: (props) => <ul className="list-disc list-inside mb-2" {...props} />,
                      ol: (props) => <ol className="list-decimal list-inside mb-2" {...props} />,
                      li: (props) => <li className="text-[#ededed] mb-1" {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-[#d4a574] pl-4 italic text-[#888]" {...props} />,
                    }}
                  >
                    {task.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Comments Thread with TaskComments Component */}
            <div>
              <h3 className="text-sm font-semibold text-[#d4a574] mb-4">
                Comments ({sortedMessages.length})
              </h3>
              
              <TaskComments 
                taskId={task.id} 
                agents={agents}
                currentAgentId="user"
              />
            </div>

            {/* Metadata Footer */}
            <div className="pt-4 border-t border-[#2a2a2a] text-xs text-[#666] space-y-1">
              <div>
                Created by {creator?.emoji} <span className="text-[#888]">{creator?.name || 'Unknown'}</span> • {formatTimestamp(task.createdAt)}
              </div>
              <div>
                Last updated {formatTimestamp(task.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
