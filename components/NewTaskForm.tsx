'use client';

import { useState, FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, useAgents } from '../lib/firebase';
import { TaskPriority } from '../types';

interface NewTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; hex: string }[] = [
  { value: 'low', label: 'Low', color: 'text-blue-400', hex: '#3b82f6' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', hex: '#eab308' },
  { value: 'high', label: 'High', color: 'text-orange-400', hex: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400', hex: '#ef4444' }
];

export default function NewTaskForm({ isOpen, onClose, onSuccess }: NewTaskFormProps) {
  const { agents } = useAgents();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const toggleAssignee = (agentId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Title is required');
      return false;
    }
    if (title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const newTask = {
        title: title.trim(),
        description: description.trim(),
        status: 'inbox' as const,
        priority,
        assigneeIds: selectedAssignees,
        tags,
        createdBy: 'system',
        dueDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tasks'), newTask);

      setTitle('');
      setDescription('');
      setPriority('medium');
      setSelectedAssignees([]);
      setTagsInput('');
      setValidationError('');

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setValidationError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSelectedAssignees([]);
    setTagsInput('');
    setValidationError('');
    onClose();
  };

  const selectedPriorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="
            bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl
            w-full max-w-2xl max-h-[90vh]
            flex flex-col
            shadow-2xl shadow-black/50
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a574] to-[#c9996a] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#ededed]">New Task</h2>
              </div>
              <button
                onClick={handleCancel}
                aria-label="Close form"
                className="
                  text-[#666] hover:text-[#ededed]
                  w-8 h-8 flex items-center justify-center
                  hover:bg-white/[0.06] rounded-lg
                  transition-all duration-200
                "
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{validationError}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                Title <span className="text-[#d4a574]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-white/[0.04] border border-white/[0.08]
                  text-[#ededed] placeholder-[#444]
                  focus:outline-none focus:border-[#d4a574]/50 focus:bg-white/[0.06]
                  transition-all duration-200
                "
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details... (Markdown supported)"
                rows={5}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-white/[0.04] border border-white/[0.08]
                  text-[#ededed] placeholder-[#444]
                  focus:outline-none focus:border-[#d4a574]/50 focus:bg-white/[0.06]
                  transition-all duration-200
                  resize-none font-mono text-sm
                "
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                Priority
              </label>
              <div className="grid grid-cols-2 sm:flex gap-2">
                {PRIORITY_OPTIONS.map(option => {
                  const isActive = priority === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPriority(option.value)}
                      className={`
                        flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 border
                        ${isActive
                          ? 'shadow-sm'
                          : 'bg-white/[0.03] text-[#666] border-white/[0.08] hover:border-white/[0.15]'
                        }
                      `}
                      style={isActive ? {
                        backgroundColor: `${option.hex}18`,
                        color: option.hex,
                        borderColor: `${option.hex}40`,
                      } : undefined}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                Assign To
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {agents.map(agent => {
                  const isActive = selectedAssignees.includes(agent.id);
                  return (
                    <label
                      key={agent.id}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        cursor-pointer transition-all duration-200 border
                        ${isActive
                          ? 'bg-[#d4a574]/10 border-[#d4a574]/30'
                          : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => toggleAssignee(agent.id)}
                        className="sr-only"
                      />
                      <span className="text-xl">{agent.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#ededed] truncate">
                          {agent.name}
                        </div>
                        <div className="text-[11px] text-[#555] truncate">
                          {agent.role}
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-[#d4a574] text-sm">✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {agents.length === 0 && (
                <p className="text-sm text-[#444] text-center py-4">No agents available</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wider mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Separate with commas: design, frontend, urgent"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-white/[0.04] border border-white/[0.08]
                  text-[#ededed] placeholder-[#444]
                  focus:outline-none focus:border-[#d4a574]/50 focus:bg-white/[0.06]
                  transition-all duration-200
                "
              />
              {tagsInput.trim() && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).map((tag, index) => (
                    <span
                      key={index}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-[#d4a574]/10 text-[#d4a574] border border-[#d4a574]/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-white/[0.06] px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="
                px-5 py-2.5 rounded-lg text-sm
                bg-white/[0.04] text-[#888] border border-white/[0.08]
                hover:bg-white/[0.07] hover:text-[#ededed]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="
                px-5 py-2.5 rounded-lg text-sm font-semibold
                bg-gradient-to-r from-[#d4a574] to-[#c9996a] text-[#0a0a0a]
                hover:from-[#ddb48a] hover:to-[#d4a574]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
              "
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#0a0a0a] border-r-transparent" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
