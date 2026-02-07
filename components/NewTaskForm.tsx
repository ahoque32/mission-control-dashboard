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

// Priority options
const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-blue-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' }
];

export default function NewTaskForm({ isOpen, onClose, onSuccess }: NewTaskFormProps) {
  const { agents } = useAgents();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Don't render if not open
  if (!isOpen) return null;

  // Handle assignee toggle
  const toggleAssignee = (agentId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // Validate form
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

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Parse tags from comma-separated input
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create task object matching Firestore schema
      const newTask = {
        title: title.trim(),
        description: description.trim(),
        status: 'inbox' as const,
        priority,
        assigneeIds: selectedAssignees,
        tags,
        createdBy: 'system', // TODO: Replace with actual user/agent ID when auth is implemented
        dueDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      await addDoc(collection(db, 'tasks'), newTask);

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setSelectedAssignees([]);
      setTagsInput('');
      setValidationError('');

      // Success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setValidationError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSelectedAssignees([]);
    setTagsInput('');
    setValidationError('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 modal-backdrop"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="
            bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl
            w-full max-w-2xl max-h-[90vh]
            flex flex-col
            shadow-2xl shadow-[#d4a574]/20
            modal-content
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-[#2a2a2a] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#ededed]">
                New Task
              </h2>
              <button
                onClick={handleCancel}
                aria-label="Close form"
                className="
                  text-[#888] hover:text-[#ededed]
                  text-2xl leading-none
                  w-8 h-8 flex items-center justify-center
                  hover:bg-[#2a2a2a] rounded
                  transition-colors
                "
              >
                ×
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{validationError}</p>
              </div>
            )}

            {/* Title Field */}
            <div>
              <label className="block text-sm font-semibold text-[#d4a574] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#1a1a1a] border border-[#2a2a2a]
                  text-[#ededed] placeholder-[#666]
                  focus:outline-none focus:border-[#d4a574]
                  transition-colors
                "
                autoFocus
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-semibold text-[#d4a574] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description... (Markdown supported)"
                rows={6}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#1a1a1a] border border-[#2a2a2a]
                  text-[#ededed] placeholder-[#666]
                  focus:outline-none focus:border-[#d4a574]
                  transition-colors
                  resize-none
                  font-mono text-sm
                "
              />
              <p className="text-xs text-[#666] mt-1">
                Supports Markdown formatting
              </p>
            </div>

            {/* Priority Field */}
            <div>
              <label className="block text-sm font-semibold text-[#d4a574] mb-2">
                Priority
              </label>
              <div className="grid grid-cols-2 sm:flex gap-2">
                {PRIORITY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`
                      flex-1 px-4 py-2.5 rounded-lg text-sm font-medium
                      transition-all
                      ${priority === option.value
                        ? `bg-[#2a2a2a] ${option.color} border-2 border-current`
                        : 'bg-[#1a1a1a] text-[#888] border-2 border-[#2a2a2a] hover:border-[#3a3a3a]'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignees Field */}
            <div>
              <label className="block text-sm font-semibold text-[#d4a574] mb-2">
                Assign To
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {agents.map(agent => (
                  <label
                    key={agent.id}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      cursor-pointer transition-all
                      ${selectedAssignees.includes(agent.id)
                        ? 'bg-[#2a2a2a] border-2 border-[#d4a574]'
                        : 'bg-[#1a1a1a] border-2 border-[#2a2a2a] hover:border-[#3a3a3a]'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssignees.includes(agent.id)}
                      onChange={() => toggleAssignee(agent.id)}
                      className="sr-only"
                    />
                    <span className="text-xl">{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#ededed] truncate">
                        {agent.name}
                      </div>
                      <div className="text-xs text-[#666] truncate">
                        {agent.role}
                      </div>
                    </div>
                    {selectedAssignees.includes(agent.id) && (
                      <span className="text-[#d4a574]">✓</span>
                    )}
                  </label>
                ))}
              </div>
              {agents.length === 0 && (
                <p className="text-sm text-[#666] text-center py-4">
                  No agents available
                </p>
              )}
            </div>

            {/* Tags Field */}
            <div>
              <label className="block text-sm font-semibold text-[#d4a574] mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Enter tags separated by commas (e.g., design, frontend, urgent)"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-[#1a1a1a] border border-[#2a2a2a]
                  text-[#ededed] placeholder-[#666]
                  focus:outline-none focus:border-[#d4a574]
                  transition-colors
                "
              />
              <p className="text-xs text-[#666] mt-1">
                Separate multiple tags with commas
              </p>
              {/* Tag preview */}
              {tagsInput.trim() && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagsInput
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0)
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="
                          text-xs px-2 py-1 rounded
                          bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]
                        "
                      >
                        {tag}
                      </span>
                    ))
                  }
                </div>
              )}
            </div>
          </form>

          {/* Footer / Actions */}
          <div className="border-t border-[#2a2a2a] p-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="
                px-6 py-2.5 rounded-lg
                bg-[#1a1a1a] text-[#888]
                border border-[#2a2a2a]
                hover:bg-[#2a2a2a] hover:text-[#ededed]
                transition-colors
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
                px-6 py-2.5 rounded-lg
                bg-[#d4a574] text-[#0a0a0a] font-semibold
                hover:bg-[#c9996a]
                transition-colors
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
