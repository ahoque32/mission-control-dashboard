'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { TaskStatus } from '../types';

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  color: string;
  count: number;
  children: ReactNode;
}

export default function KanbanColumn({ 
  id, 
  label, 
  color, 
  count, 
  children 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-[85vw] sm:w-72 md:w-80 rounded-2xl
        transition-all duration-200 snap-start
        backdrop-blur-xl
        ${isOver 
          ? 'bg-white/10 border border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
          : 'bg-white/[0.04] border border-white/10'}
      `}
    >
      {/* Colored top accent border */}
      <div 
        className="h-[3px] rounded-t-2xl mx-0"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />

      {/* Column Header */}
      <div className="px-4 py-3 backdrop-blur-sm bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
            />
            <h3 className="font-semibold text-sm text-foreground tracking-wide uppercase">
              {label}
            </h3>
          </div>
          <span 
            className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${color}18`, 
              color: color,
              border: `1px solid ${color}30`
            }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="px-3 pb-3 pt-1 min-h-[420px] max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin">
        {children}
      </div>
    </div>
  );
}
