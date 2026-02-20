'use client';

import { useState, useRef } from 'react';
import { useCreateContentItem, useAgents } from '../lib/convex';
import Icon from './ui/Icon';

interface ContentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStage: string;
}

export default function ContentCreateModal({ isOpen, onClose, defaultStage }: ContentCreateModalProps) {
  const createContent = useCreateContentItem();
  const { agents } = useAgents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: defaultStage,
    script: '',
    thumbnail: '',
    agentId: '',
    agentName: '',
    tags: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await createContent({
        title: formData.title,
        stage: formData.stage,
        description: formData.description || undefined,
        script: formData.script || undefined,
        thumbnail: formData.thumbnail || undefined,
        agentId: formData.agentId || undefined,
        agentName: formData.agentName || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onClose();
      setFormData({
        title: '',
        description: '',
        stage: defaultStage,
        script: '',
        thumbnail: '',
        agentId: '',
        agentName: '',
        tags: '',
      });
      setThumbnailPreview(null);
    } catch (err) {
      console.error('Error creating content:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setFormData(prev => ({
      ...prev,
      agentId: agentId,
      agentName: agent?.name || '',
    }));
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setThumbnailPreview(result);
        setFormData(prev => ({ ...prev, thumbnail: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const stages = [
    { id: 'idea', label: '💡 Idea' },
    { id: 'script', label: '📝 Script' },
    { id: 'thumbnail', label: '🖼️ Thumbnail' },
    { id: 'filming', label: '🎥 Filming' },
    { id: 'editing', label: '✂️ Editing' },
    { id: 'published', label: '🚀 Published' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Create New Content</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <Icon name="x-lg" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              placeholder="Enter content title..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Stage</label>
              <select
                value={formData.stage}
                onChange={e => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              >
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Owner</label>
              <select
                value={formData.agentId}
                onChange={e => handleAgentChange(e.target.value)}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground h-20 resize-none"
              placeholder="Brief description of the content..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Script / Notes</label>
            <textarea
              value={formData.script}
              onChange={e => setFormData(prev => ({ ...prev, script: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground h-32 resize-none font-mono text-sm"
              placeholder="Write your script or notes here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Thumbnail</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleThumbnailUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-border hover:border-emerald-500/50 text-foreground-secondary hover:text-foreground transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="image" size={24} />
                    <span className="text-sm">Click to upload thumbnail</span>
                  </div>
                </button>
              </div>
              
              {thumbnailPreview && (
                <div className="w-32 h-20 rounded-lg overflow-hidden bg-black/20">
                  <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              placeholder="tutorial, review, vlog..."
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
              {isSubmitting ? 'Creating...' : 'Create Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
