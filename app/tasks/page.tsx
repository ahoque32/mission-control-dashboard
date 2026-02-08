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
import { Task, TaskStatus, TaskPriority } from '../../types';
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

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_CHIP_COLORS: Record<TaskPriority, string> = {
  low: '#3b82f6',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444'
};

export default function TasksPage() {
  const { tasks, loading, error } = useTasks();
  const { agents } = useAgents();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isNewTaskFormOpen, setIsNewTaskFormOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
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
      if (selectedAssignees.length > 0) {
        const hasSelectedAssignee = task.assigneeIds.some(id => 
          selectedAssignees.includes(id)
        );
        if (!hasSelectedAssignee) return false;
      }
      if (selectedPriorities.length > 0) {
        if (!selectedPriorities.includes(task.priority)) return false;
      }
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
    if (task) setActiveTask(task);
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
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Toggle filters
  const toggleAssignee = (agentId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const togglePriority = (priority: TaskPriority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const toggleStatus = (status: TaskStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
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

  const activeFilterCount = selectedAssignees.length + selectedPriorities.length + selectedStatuses.length;

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
          <h3 className="text-xl font-semibold text-[#ededed] mb-2">Failed to load tasks</h3>
          <p className="text-[#888] text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NewTaskForm
        isOpen={isNewTaskFormOpen}
        onClose={() => setIsNewTaskFormOpen(false)}
        onSuccess={() => console.log('Task created successfully!')}
      />

      <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#ededed] tracking-tight">Tasks</h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#d4a574]/15 text-[#d4a574] border border-[#d4a574]/20">
              {filteredTasks.length}
            </span>
            {hasActiveFilters && (
              <span className="text-xs text-[#888] italic">filtered</span>
            )}
          </div>
          <button
            onClick={() => setIsNewTaskFormOpen(true)}
            className="
              group flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm
              bg-gradient-to-r from-[#d4a574] to-[#c9996a] text-[#0a0a0a]
              hover:from-[#ddb48a] hover:to-[#d4a574]
              shadow-md shadow-[#d4a574]/20 hover:shadow-lg hover:shadow-[#d4a574]/30
              transition-all duration-200
            "
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* ── Collapsible Filter Bar ── */}
        <div className="mb-5">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="
              flex items-center gap-2 text-sm text-[#888] hover:text-[#ededed]
              transition-colors duration-200 mb-2
            "
          >
            <svg 
              className={`w-3.5 h-3.5 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#d4a574]/20 text-[#d4a574] animate-pulse">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${filtersOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="backdrop-blur-md bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-4">
              {/* Assignee Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                  Assignee
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {agents.map(agent => {
                    const active = selectedAssignees.includes(agent.id);
                    return (
                      <button
                        key={agent.id}
                        onClick={() => toggleAssignee(agent.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium
                          transition-all duration-200 border
                          ${active
                            ? 'bg-[#d4a574]/20 text-[#d4a574] border-[#d4a574]/40 shadow-sm shadow-[#d4a574]/10'
                            : 'bg-white/[0.03] text-[#888] border-white/[0.08] hover:border-white/[0.15] hover:text-[#aaa]'
                          }
                        `}
                      >
                        {agent.emoji} {agent.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map(priority => {
                    const active = selectedPriorities.includes(priority);
                    const chipColor = PRIORITY_CHIP_COLORS[priority];
                    return (
                      <button
                        key={priority}
                        onClick={() => togglePriority(priority)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium capitalize
                          transition-all duration-200 border
                          ${active
                            ? 'shadow-sm'
                            : 'bg-white/[0.03] text-[#888] border-white/[0.08] hover:border-white/[0.15] hover:text-[#aaa]'
                          }
                        `}
                        style={active ? {
                          backgroundColor: `${chipColor}20`,
                          color: chipColor,
                          borderColor: `${chipColor}40`,
                          boxShadow: `0 1px 4px ${chipColor}15`
                        } : undefined}
                      >
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COLUMNS.map(column => {
                    const active = selectedStatuses.includes(column.id);
                    return (
                      <button
                        key={column.id}
                        onClick={() => toggleStatus(column.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium
                          transition-all duration-200 border
                          ${active
                            ? 'shadow-sm'
                            : 'bg-white/[0.03] text-[#888] border-white/[0.08] hover:border-white/[0.15] hover:text-[#aaa]'
                          }
                        `}
                        style={active ? {
                          backgroundColor: `${column.color}20`,
                          color: column.color,
                          borderColor: `${column.color}40`,
                          boxShadow: `0 1px 4px ${column.color}15`
                        } : undefined}
                      >
                        {column.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#d4a574] hover:text-[#ddb48a] transition-colors duration-200 font-medium"
                  >
                    ✕ Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Empty State: Filtered ── */}
        {filteredTasks.length === 0 && tasks.length > 0 && (
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/[0.06] rounded-xl p-12 text-center mb-6">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-[#ededed] mb-2">No tasks match your filters</h3>
            <p className="text-[#666] text-sm mb-4">Try adjusting your filter criteria</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#d4a574]/15 text-[#d4a574] border border-[#d4a574]/20 hover:bg-[#d4a574]/25 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Empty State: No Tasks ── */}
        {tasks.length === 0 && (
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/[0.06] rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-[#ededed] mb-2">No tasks yet</h3>
            <p className="text-[#666] text-sm mb-4">Create your first task to get started</p>
            <button
              onClick={() => setIsNewTaskFormOpen(true)}
              className="
                px-5 py-2.5 rounded-lg font-semibold text-sm
                bg-gradient-to-r from-[#d4a574] to-[#c9996a] text-[#0a0a0a]
                hover:from-[#ddb48a] hover:to-[#d4a574]
                transition-all duration-200
              "
            >
              + New Task
            </button>
          </div>
        )}

        {/* ── Kanban Board ── */}
        {filteredTasks.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth -mx-1 px-1">
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
                      <div className="space-y-0">
                        {columnTasks.map(task => (
                          <DraggableTaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </SortableContext>

                    {/* Empty column state */}
                    {columnTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-full border-2 border-dashed border-white/[0.06] rounded-lg py-8 px-4 text-center">
                          <div className="text-2xl mb-2 opacity-30">📥</div>
                          <p className="text-[11px] text-[#444] font-medium">
                            Drop tasks here
                          </p>
                        </div>
                      </div>
                    )}
                  </KanbanColumn>
                );
              })}
            </div>

            {/* Drag Overlay — dramatic style */}
            <DragOverlay>
              {activeTask ? (
                <div className="
                  bg-[#1a1a1a]/95 backdrop-blur-lg 
                  border-2 border-[#d4a574]/60 
                  rounded-xl p-4 
                  shadow-2xl shadow-[#d4a574]/20
                  rotate-[2deg] scale-105
                  max-w-[300px]
                ">
                  <h4 className="text-sm font-semibold text-[#ededed] line-clamp-2 mb-1">
                    {activeTask.title}
                  </h4>
                  {activeTask.description && (
                    <p className="text-[11px] text-[#888] line-clamp-1">{activeTask.description}</p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </>
  );
}
