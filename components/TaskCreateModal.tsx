'use client';

import { useState } from 'react';
import { useCreateMCTask, useAgents } from '../lib/convex';
import Icon from './ui/Icon';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultColumn: string;
}

export default function TaskCreateModal({ isOpen, onClose, defaultColumn }: TaskCreateModalProps) {
  const createTask = useCreateMCTask();
  const { agents } = useAgents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    column: defaultColumn,
    assigneeId: '',
    assigneeName: '',
    dueDate: '',
    tags: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        column: formData.column,
        assigneeId: formData.assigneeId || undefined,
        assigneeName: formData.assigneeName || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).getTime() : undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdBy: 'user',
      });
      onClose();
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        column: defaultColumn,
        assigneeId: '',
        assigneeName: '',
        dueDate: '',
        tags: '',
      });
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssigneeChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setFormData(prev => ({
      ...prev,
      assigneeId: agentId,
      assigneeName: agent?.name || '',
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass-card w-full max-w-lg p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Create New Task</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <Icon name="x-lg" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              placeholder="Enter task title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground h-24 resize-none"
              placeholder="Enter task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Column</label>
              <select
                value={formData.column}
                onChange={e => setFormData(prev => ({ ...prev, column: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Assignee</label>
              <select
                value={formData.assigneeId}
                onChange={e => handleAssigneeChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              >
                <option value="">Unassigned</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.emoji} {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              placeholder="bug, feature, urgent..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 text-foreground-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
