'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MCTask } from '../lib/convex';
import Icon from './ui/Icon';

interface TaskBoardCardProps {
  task: MCTask;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function TaskBoardCard({ task }: TaskBoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        glass-card p-3 cursor-grab active:cursor-grabbing
        hover:border-emerald-500/30 transition-all
        group
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 flex-1">
          {task.title}
        </h4>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity">
          <Icon name="pencil" size={12} className="text-foreground-muted" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
          
          {task.dueDate && (
            <span className="text-xs text-foreground-muted flex items-center gap-1">
              <Icon name="calendar" size={10} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {task.assigneeName && (
          <div className="flex items-center gap-1 text-xs text-foreground-secondary">
            <Icon name="person" size={12} />
            <span>{task.assigneeName}</span>
          </div>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-foreground-muted">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
