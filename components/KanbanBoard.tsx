'use client';

import { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useTasks, useUpdateTaskStatus } from '../lib/convex';
import { Task, TaskStatus } from '../types';
import KanbanColumn from './KanbanColumn';
import DraggableTaskCard from './DraggableTaskCard';

// Column definitions with display labels
const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'inbox', label: 'Inbox', color: '#666' },
  { id: 'assigned', label: 'Assigned', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#d4a574' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' }
];

export default function KanbanBoard() {
  const { tasks, loading, error } = useTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure drag sensors — PointerSensor for desktop, TouchSensor for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  // Handle drag end - update task status
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the task being moved
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      await updateTaskStatus({ id: taskId as any, status: newStatus });
      console.log(`Task ${taskId} moved to ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading tasks">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" aria-hidden="true" />
          <p className="text-foreground-secondary">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Failed to load tasks
          </h3>
          <p className="text-foreground-secondary text-sm">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Kanban Board Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4" role="region" aria-label="Task board">
        {COLUMNS.map(column => {
          const columnTasks = tasksByStatus[column.id];
          const taskIds = columnTasks.map(task => task.id);

          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              label={column.label}
              color={column.color}
              count={columnTasks.length}
            >
              <SortableContext
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {columnTasks.map(task => (
                    <DraggableTaskCard key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>

              {/* Empty state */}
              {columnTasks.length === 0 && (
                <div className="text-center py-8 text-foreground-muted text-sm">
                  No tasks
                </div>
              )}
            </KanbanColumn>
          );
        })}
      </div>

      {/* Drag Overlay - shows the task being dragged */}
      <DragOverlay>
        {activeTask ? (
          <div className="bg-white/5 border border-emerald-500 rounded-lg p-4 shadow-xl opacity-90 cursor-grabbing">
            <h4 className="text-sm font-medium text-foreground line-clamp-2">
              {activeTask.title}
            </h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
