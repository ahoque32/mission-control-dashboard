'use client';

import { useDroppable } from '@dnd-kit/core';
import Icon from './ui/Icon';

interface ContentPipelineColumnProps {
  id: string;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
  onAddContent: () => void;
}

export default function ContentPipelineColumn({
  id,
  label,
  color,
  count,
  children,
  onAddContent,
}: ContentPipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-64 flex flex-col max-h-full
        glass-card rounded-xl overflow-hidden
        transition-all duration-200
        ${isOver ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''}
      `}
    >
      <div 
        className="px-3 py-3 border-b border-border flex items-center justify-between"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-foreground-secondary">
            {count}
          </span>
        </div>
        <button
          onClick={onAddContent}
          className="p-1.5 rounded-lg hover:bg-white/10 text-foreground-secondary hover:text-foreground transition-colors"
          title="Add content"
        >
          <Icon name="plus-lg" size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {children}
      </div>
    </div>
  );
}
