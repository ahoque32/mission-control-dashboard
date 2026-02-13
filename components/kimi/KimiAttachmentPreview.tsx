'use client';

import Icon from '../ui/Icon';

import type { AttachmentState } from './kimi.types';

interface KimiAttachmentPreviewProps {
  attachments: AttachmentState[];
  onRemove: (id: string) => void;
}

export default function KimiAttachmentPreview({
  attachments,
  onRemove,
}: KimiAttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 border-b border-white/10 overflow-x-auto">
      {attachments.map((att) => (
        <div
          key={att.id}
          className={`relative shrink-0 rounded-lg overflow-hidden border ${
            att.status === 'error'
              ? 'border-red-500/40'
              : 'border-white/10'
          }`}
        >
          {/* Remove button */}
          <button
            onClick={() => onRemove(att.id)}
            className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center
                       rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80
                       transition-colors text-[10px]"
          >
            ✕
          </button>

          {att.type === 'image' && att.preview ? (
            // Image thumbnail
            <div className="w-20 h-20">
              <img
                src={att.preview}
                alt={att.file.name}
                className="w-full h-full object-cover"
              />
              {att.status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-5 h-5 spinner" />
                </div>
              )}
            </div>
          ) : (
            // File card
            <div className="w-36 h-20 p-2 flex flex-col justify-center bg-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">
                  {att.type === 'code' ? '💻' : '📄'}
                </span>
                <span className="text-xs text-foreground truncate">
                  {att.file.name.length > 20
                    ? att.file.name.slice(0, 17) + '...'
                    : att.file.name}
                </span>
              </div>
              <span className="text-[10px] text-foreground-muted">
                {att.sizeBytes < 1024
                  ? `${att.sizeBytes} B`
                  : att.sizeBytes < 1024 * 1024
                    ? `${(att.sizeBytes / 1024).toFixed(1)} KB`
                    : `${(att.sizeBytes / (1024 * 1024)).toFixed(1)} MB`}
              </span>
              {att.status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-5 h-5 spinner" />
                </div>
              )}
              {att.status === 'error' && (
                <span className="text-[10px] text-red-400 mt-0.5 truncate">
                  {att.error || 'Error'}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
