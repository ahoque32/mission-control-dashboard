'use client';

import { useDroppable } from '@dnd-kit/core';
import Icon from './ui/Icon';

interface TaskBoardColumnProps {
  id: string;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
  onAddTask: () => void;
}

export default function TaskBoardColumn({
  id,
  label,
  color,
  count,
  children,
  onAddTask,
}: TaskBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-72 flex flex-col max-h-full
        glass-card rounded-xl overflow-hidden
        transition-all duration-200
        ${isOver ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''}
      `}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-border flex items-center justify-between"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-foreground-secondary">
            {count}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1.5 rounded-lg hover:bg-white/10 text-foreground-secondary hover:text-foreground transition-colors"
          title="Add task"
        >
          <Icon name="plus-lg" size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}
