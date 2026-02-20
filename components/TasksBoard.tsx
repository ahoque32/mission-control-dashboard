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
import { useMCTasks, useUpdateMCTaskColumn, MCTask } from '../lib/convex';
import TaskBoardColumn from './TaskBoardColumn';
import TaskBoardCard from './TaskBoardCard';
import TaskCreateModal from './TaskCreateModal';
import Icon from './ui/Icon';

// Column definitions for MC Dashboard V2
const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#6b7280' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
] as const;

export default function TasksBoard() {
  const { tasks, loading } = useMCTasks();
  const updateTaskColumn = useUpdateMCTaskColumn();
  const [activeTask, setActiveTask] = useState<MCTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createColumn, setCreateColumn] = useState('backlog');

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  // Group tasks by column
  const tasksByColumn = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.column === column.id);
    return acc;
  }, {} as Record<string, MCTask[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newColumn = over.id as string;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.column === newColumn) return;

    try {
      await updateTaskColumn({ id: taskId as any, column: newColumn });
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const openCreateModal = (column: string) => {
    setCreateColumn(column);
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-foreground-secondary">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {COLUMNS.map(column => {
            const columnTasks = tasksByColumn[column.id] || [];
            const taskIds = columnTasks.map(task => task.id);

            return (
              <TaskBoardColumn
                key={column.id}
                id={column.id}
                label={column.label}
                color={column.color}
                count={columnTasks.length}
                onAddTask={() => openCreateModal(column.id)}
              >
                <SortableContext
                  items={taskIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {columnTasks.map(task => (
                      <TaskBoardCard key={task.id} task={task} />
                    ))}
                  </div>
                </SortableContext>

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-foreground-muted text-sm">
                    No tasks
                  </div>
                )}
              </TaskBoardColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="glass-card p-4 shadow-xl opacity-90 cursor-grabbing rotate-2">
              <h4 className="text-sm font-medium text-foreground line-clamp-2">
                {activeTask.title}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTask.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                  activeTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  activeTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {activeTask.priority}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultColumn={createColumn}
      />
    </>
  );
}
