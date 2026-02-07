'use client';

import { Task, Agent, TaskStatus, TaskPriority } from '../types';

/**
 * TaskCard - Individual task card component for Mission Control Dashboard
 * 
 * Displays task summary with:
 * - Title and description
 * - Priority badge (high=red, medium=yellow, low=gray)
 * - Assignee avatars (agent emojis)
 * - Status indicator (colored dot)
 * - Tags
 * 
 * Clicking the card triggers onClick handler (for opening detail modal in mc-008)
 */
interface TaskCardProps {
  task: Task;
  assigneeEmojis?: string[]; // Array of agent emojis for the assignees
  onClick?: () => void;
}

// Priority badge colors (high=red, medium=yellow, low=gray)
const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Low' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Med' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'High' },
  urgent: { bg: 'bg-red-600/30', text: 'text-red-300', label: 'Urgent' }
};

// Status indicator colors
const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string }> = {
  inbox: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  assigned: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  in_progress: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  review: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  done: { bg: 'bg-green-500/20', text: 'text-green-400' },
  blocked: { bg: 'bg-red-500/20', text: 'text-red-400' }
};

export default function TaskCard({ task, assigneeEmojis = [], onClick }: TaskCardProps) {
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.inbox;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="
        bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4
        hover:border-[#d4a574]/50 hover:shadow-lg hover:shadow-[#d4a574]/10
        transition-all duration-200
        cursor-pointer
        group
      "
    >
      {/* Header: Title & Status Indicator */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-medium text-[#ededed] line-clamp-2 flex-1 group-hover:text-[#d4a574] transition-colors">
          {task.title}
        </h4>
        
        {/* Status Dot */}
        <div 
          className={`w-2 h-2 rounded-full mt-1 ${statusStyle.bg} ${statusStyle.text}`}
          title={task.status}
        />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-[#888] mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Priority Badge & Assignee Avatars */}
      <div className="flex items-center justify-between gap-2">
        {/* Priority Badge */}
        <span 
          className={`
            text-xs font-medium px-2 py-1 rounded
            ${priorityStyle.bg} ${priorityStyle.text}
          `}
        >
          {priorityStyle.label}
        </span>

        {/* Assignee Emojis */}
        {assigneeEmojis.length > 0 && (
          <div className="flex items-center -space-x-1">
            {assigneeEmojis.slice(0, 3).map((emoji, index) => (
              <div
                key={index}
                className="
                  w-6 h-6 rounded-full 
                  bg-[#0a0a0a] border border-[#2a2a2a]
                  flex items-center justify-center
                  text-xs
                  hover:scale-110 transition-transform
                "
                title={`Assignee ${index + 1}`}
              >
                {emoji}
              </div>
            ))}
            {assigneeEmojis.length > 3 && (
              <div
                className="
                  w-6 h-6 rounded-full 
                  bg-[#0a0a0a] border border-[#2a2a2a]
                  flex items-center justify-center
                  text-[10px] text-[#666] font-mono
                "
                title={`+${assigneeEmojis.length - 3} more assignees`}
              >
                +{assigneeEmojis.length - 3}
              </div>
            )}
          </div>
        )}

        {/* No assignees indicator */}
        {assigneeEmojis.length === 0 && (
          <div className="text-xs text-[#666] font-mono">
            Unassigned
          </div>
        )}
      </div>

      {/* Tags (if present) */}
      {task.tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 rounded bg-[#0a0a0a] text-[#666] border border-[#2a2a2a]"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-[#666] font-mono self-center">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
