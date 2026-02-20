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
import { useContentItems, useMoveContentStage, ContentItem, useAgents } from '../lib/convex';
import ContentPipelineColumn from './ContentPipelineColumn';
import ContentPipelineCard from './ContentPipelineCard';
import ContentCreateModal from './ContentCreateModal';
import Icon from './ui/Icon';

// Pipeline stages
const STAGES = [
  { id: 'idea', label: '💡 Idea', color: '#6b7280' },
  { id: 'script', label: '📝 Script', color: '#3b82f6' },
  { id: 'thumbnail', label: '🖼️ Thumbnail', color: '#8b5cf6' },
  { id: 'filming', label: '🎥 Filming', color: '#f59e0b' },
  { id: 'editing', label: '✂️ Editing', color: '#ec4899' },
  { id: 'published', label: '🚀 Published', color: '#10b981' },
] as const;

export default function ContentPipeline() {
  const { items, loading } = useContentItems();
  const moveStage = useMoveContentStage();
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStage, setCreateStage] = useState('idea');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const itemsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = items.filter(item => item.stage === stage.id);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const itemId = event.active.id as string;
    const item = items.find(i => i.id === itemId);
    if (item) setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const itemId = active.id as string;
    const newStage = over.id as string;

    const item = items.find(i => i.id === itemId);
    if (!item || item.stage === newStage) return;

    try {
      await moveStage({ id: itemId as any, stage: newStage });
    } catch (err) {
      console.error('Error moving content:', err);
    }
  };

  const openCreateModal = (stage: string) => {
    setCreateStage(stage);
    setIsCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4" />
          <p className="text-foreground-secondary">Loading content pipeline...</p>
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
        <div className="flex gap-3 overflow-x-auto pb-4 h-full">
          {STAGES.map(stage => {
            const stageItems = itemsByStage[stage.id] || [];
            const itemIds = stageItems.map(item => item.id);

            return (
              <ContentPipelineColumn
                key={stage.id}
                id={stage.id}
                label={stage.label}
                color={stage.color}
                count={stageItems.length}
                onAddContent={() => openCreateModal(stage.id)}
              >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {stageItems.map(item => (
                      <ContentPipelineCard key={item.id} item={item} />
                    ))}
                  </div>
                </SortableContext>

                {stageItems.length === 0 && (
                  <div className="text-center py-8 text-foreground-muted text-sm">
                    Drop content here
                  </div>
                )}
              </ContentPipelineColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="glass-card p-4 shadow-xl opacity-90 cursor-grabbing rotate-2">
              <h4 className="text-sm font-medium text-foreground">{activeItem.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ContentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultStage={createStage}
      />
    </>
  );
}
