'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Task, TaskPriority } from '../types';
import { Timestamp } from 'firebase/firestore';

interface DraggableTaskCardProps {
  task: Task;
}

// Priority config — color used for left-border accent (Linear-style)
const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; text: string; label: string }> = {
  low:    { color: '#3b82f6', bg: 'bg-blue-500/15',   text: 'text-blue-400',   label: 'Low' },
  medium: { color: '#eab308', bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Med' },
  high:   { color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'High' },
  urgent: { color: '#ef4444', bg: 'bg-red-500/15',    text: 'text-red-400',    label: 'Urgent' }
};

// Avatar color palette for assignees
const AVATAR_COLORS = [
  '#d4a574', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f97316', '#ec4899', '#06b6d4'
];

// Tag color palette
const TAG_COLORS = [
  { bg: 'bg-blue-500/15', text: 'text-blue-300' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  { bg: 'bg-purple-500/15', text: 'text-purple-300' },
  { bg: 'bg-amber-500/15', text: 'text-amber-300' },
  { bg: 'bg-rose-500/15', text: 'text-rose-300' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-300' },
];

function getRelativeTime(timestamp: Timestamp | undefined | null): string {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo`;
  } catch {
    return '';
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as const
  };

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const relativeTime = getRelativeTime(task.updatedAt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative rounded-lg overflow-hidden
        backdrop-blur-sm bg-white/[0.04] border border-white/[0.08]
        hover:bg-white/[0.07] hover:border-white/[0.15]
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30
        transition-all duration-200 cursor-grab active:cursor-grabbing
        mb-2.5
      `}
    >
      {/* Priority left-border accent (Linear-style) */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
        style={{ backgroundColor: priority.color }}
      />

      <div className="pl-4 pr-3 py-3">
        {/* Top row: Title + timestamp */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link 
            href={`/tasks/${task.id}`}
            className="block text-[13px] font-medium text-[#ededed] line-clamp-2 hover:text-[#d4a574] transition-colors leading-snug"
            onClick={(e) => e.stopPropagation()}
          >
            {task.title}
          </Link>
          {relativeTime && (
            <span className="text-[10px] text-[#555] whitespace-nowrap mt-0.5 font-mono">
              {relativeTime}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-[11px] text-[#666] mb-2.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Tags as colored pills */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {task.tags.slice(0, 3).map((tag, i) => {
              const tagColor = TAG_COLORS[hashString(tag) % TAG_COLORS.length];
              return (
                <span
                  key={tag}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tagColor.bg} ${tagColor.text}`}
                >
                  {tag}
                </span>
              );
            })}
            {task.tags.length > 3 && (
              <span className="text-[10px] text-[#555] font-mono px-1">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Priority badge + Assignee avatars */}
        <div className="flex items-center justify-between">
          <span 
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}
          >
            {priority.label}
          </span>

          {/* Assignee avatars */}
          {task.assigneeIds.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assigneeIds.slice(0, 3).map((id, i) => {
                const color = AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];
                const letter = id.charAt(0).toUpperCase();
                return (
                  <div
                    key={id}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-1 ring-[#111]"
                    style={{ backgroundColor: `${color}30`, color: color }}
                    title={id}
                  >
                    {letter}
                  </div>
                );
              })}
              {task.assigneeIds.length > 3 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono text-[#666] bg-white/5 ring-1 ring-[#111]">
                  +{task.assigneeIds.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
