'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Task, Priority } from '../types';

interface DraggableTaskCardProps {
  task: Task;
}

// Priority badge colors
const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Low' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Med' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'High' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Urgent' }
};

export default function DraggableTaskCard({ task }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? '1.02' : '1',
    zIndex: isDragging ? 50 : 'auto'
  };

  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="
        bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4
        hover:border-[#d4a574]/30 transition-all cursor-grab
        active:cursor-grabbing
      "
    >
      {/* Task Title */}
      <Link 
        href={`/tasks/${task.id}`}
        className="block text-sm font-medium text-[#ededed] mb-2 line-clamp-2 hover:text-[#d4a574] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </Link>

      {/* Task Description (truncated) */}
      {task.description && (
        <p className="text-xs text-[#888] mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Priority & Tags */}
      <div className="flex items-center justify-between">
        {/* Priority Badge */}
        <span 
          className={`
            text-xs font-medium px-2 py-1 rounded
            ${priorityStyle.bg} ${priorityStyle.text}
          `}
        >
          {priorityStyle.label}
        </span>

        {/* Tags (show first tag if exists) */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#666]">
              {task.tags[0]}
            </span>
            {task.tags.length > 1 && (
              <span className="text-xs text-[#666] font-mono">
                +{task.tags.length - 1}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Assignees indicator */}
      {task.assigneeIds.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#666]">👤</span>
            <span className="text-xs text-[#888] font-mono">
              {task.assigneeIds.length} assigned
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
