'use client';

import { useState, useMemo } from 'react';
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
import { useTasks, useAgents, db } from '../../lib/firebase';
import { Task, TaskStatus, Priority } from '../../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import KanbanColumn from '../../components/KanbanColumn';
import DraggableTaskCard from '../../components/DraggableTaskCard';
import NewTaskForm from '../../components/NewTaskForm';

// Column definitions
const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'inbox', label: 'Inbox', color: '#666' },
  { id: 'assigned', label: 'Assigned', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#d4a574' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' }
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export default function TasksPage() {
  const { tasks, loading, error } = useTasks();
  const { agents } = useAgents();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);

  // Filter state
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Assignee filter
      if (selectedAssignees.length > 0) {
        const hasSelectedAssignee = task.assigneeIds.some(id => 
          selectedAssignees.includes(id)
        );
        if (!hasSelectedAssignee) return false;
      }

      // Priority filter
      if (selectedPriorities.length > 0) {
        if (!selectedPriorities.includes(task.priority)) return false;
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(task.status)) return false;
      }

      return true;
    });
  }, [tasks, selectedAssignees, selectedPriorities, selectedStatuses]);

  // Group filtered tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter(task => task.status === column.id);
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

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      console.log(`Task ${taskId} moved to ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Toggle filters
  const toggleAssignee = (agentId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const togglePriority = (priority: Priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const toggleStatus = (status: TaskStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedAssignees([]);
    setSelectedPriorities([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters = 
    selectedAssignees.length > 0 || 
    selectedPriorities.length > 0 || 
    selectedStatuses.length > 0;

  // Handle New Task button
  const handleNewTask = () => {
    setIsNewTaskFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#d4a574] border-r-transparent mb-4" />
          <p className="text-[#888]">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-[#ededed] mb-2">
            Failed to load tasks
          </h3>
          <p className="text-[#888] text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* New Task Form Modal */}
      <NewTaskForm
        isOpen={isNewTaskFormOpen}
        onClose={() => setIsNewTaskFormOpen(false)}
        onSuccess={() => {
          console.log('Task created successfully!');
        }}
      />

      <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header with New Task button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#ededed] mb-2">Tasks</h1>
          <p className="text-[#888]">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            {hasActiveFilters && <span className="text-[#d4a574]"> (filtered)</span>}
          </p>
        </div>
        <button
          onClick={handleNewTask}
          className="
            px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg
            hover:bg-[#c9996a] transition-colors
            shadow-lg hover:shadow-xl
          "
        >
          + New Task
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex flex-wrap gap-6">
          {/* Assignee Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#888] mb-2">
              Assignee
            </label>
            <div className="flex flex-wrap gap-2">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => toggleAssignee(agent.id)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${selectedAssignees.includes(agent.id)
                      ? 'bg-[#d4a574] text-[#0a0a0a]'
                      : 'bg-[#0a0a0a] text-[#888] border border-[#2a2a2a] hover:border-[#d4a574]/50'
                    }
                  `}
                >
                  {agent.emoji} {agent.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#888] mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(priority => (
                <button
                  key={priority}
                  onClick={() => togglePriority(priority)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                    ${selectedPriorities.includes(priority)
                      ? 'bg-[#d4a574] text-[#0a0a0a]'
                      : 'bg-[#0a0a0a] text-[#888] border border-[#2a2a2a] hover:border-[#d4a574]/50'
                    }
                  `}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#888] mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {COLUMNS.map(column => (
                <button
                  key={column.id}
                  onClick={() => toggleStatus(column.id)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${selectedStatuses.includes(column.id)
                      ? 'bg-[#d4a574] text-[#0a0a0a]'
                      : 'bg-[#0a0a0a] text-[#888] border border-[#2a2a2a] hover:border-[#d4a574]/50'
                    }
                  `}
                >
                  {column.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <button
              onClick={clearFilters}
              className="text-sm text-[#d4a574] hover:text-[#c9996a] transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Empty State for Filtered Tasks */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center mb-6">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-[#ededed] mb-2">
            No tasks match your filters
          </h3>
          <p className="text-[#888] mb-4">
            Try adjusting your filter criteria to see more tasks
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-[#d4a574] text-[#0a0a0a] rounded-lg hover:bg-[#c9996a] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Empty State for No Tasks at All */}
      {tasks.length === 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-[#ededed] mb-2">
            No tasks yet
          </h3>
          <p className="text-[#888] mb-4">
            Create your first task to get started
          </p>
          <button
            onClick={handleNewTask}
            className="px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c9996a] transition-colors"
          >
            + New Task
          </button>
        </div>
      )}

      {/* Kanban Board */}
      {filteredTasks.length > 0 && (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-[#666] text-sm">
                    No tasks
                  </div>
                )}
              </KanbanColumn>
            );
          })}
        </div>

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
      )}
      </div>
    </>
  );
}
