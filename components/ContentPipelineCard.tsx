'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentItem } from '../lib/convex';
import Icon from './ui/Icon';

interface ContentPipelineCardProps {
  item: ContentItem;
}

export default function ContentPipelineCard({ item }: ContentPipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasScript = item.script && item.script.trim().length > 0;
  const hasThumbnail = item.thumbnail && item.thumbnail.trim().length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card p-3 cursor-grab active:cursor-grabbing hover:border-emerald-500/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 flex-1">
          {item.title}
        </h4>
      </div>

      {item.description && (
        <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Thumbnail preview */}
      {hasThumbnail && (
        <div className="mt-2 rounded-lg overflow-hidden bg-black/20 aspect-video">
          <img 
            src={item.thumbnail} 
            alt="Thumbnail" 
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {hasScript && (
            <span className="text-xs flex items-center gap-1 text-foreground-muted" title="Has script">
              <Icon name="file-text" size={10} />
            </span>
          )}
          {hasThumbnail && (
            <span className="text-xs flex items-center gap-1 text-foreground-muted" title="Has thumbnail">
              <Icon name="image" size={10} />
            </span>
          )}
        </div>

        {item.agentName && (
          <div className="flex items-center gap-1 text-xs text-foreground-secondary">
            <Icon name="person" size={10} />
            <span>{item.agentName}</span>
          </div>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-foreground-muted">
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-xs text-foreground-muted">+{item.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
