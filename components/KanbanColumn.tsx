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
        flex-shrink-0 w-[85vw] sm:w-72 md:w-80 bg-[#0f0f0f] border rounded-lg
        transition-all
        ${isOver ? 'border-[#d4a574] bg-[#1a1a1a]' : 'border-[#2a2a2a]'}
      `}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-[#ededed]">
              {label}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#666] bg-[#1a1a1a] px-2 py-1 rounded">
            {count}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-3 min-h-[400px] max-h-[calc(100vh-16rem)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
