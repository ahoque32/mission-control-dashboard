'use client';

import { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useTasks, db } from '../lib/firebase';
import { Task, TaskStatus } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
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

  // Handle drag end - update Firestore
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
      // Update task status in Firestore
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      console.log(`Task ${taskId} moved to ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      // TODO: Add toast notification for error
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#d4a574] border-r-transparent mb-4" />
          <p className="text-[#888]">Loading tasks...</p>
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
          <h3 className="text-xl font-semibold text-[#ededed] mb-2">
            Failed to load tasks
          </h3>
          <p className="text-[#888] text-sm">
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
      <div className="flex gap-4 overflow-x-auto pb-4">
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
                <div className="text-center py-8 text-[#666] text-sm">
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
          <div className="bg-[#1a1a1a] border border-[#d4a574] rounded-lg p-4 shadow-xl opacity-90 cursor-grabbing">
            <h4 className="text-sm font-medium text-[#ededed] line-clamp-2">
              {activeTask.title}
            </h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
