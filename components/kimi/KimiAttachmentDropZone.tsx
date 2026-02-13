'use client';

interface KimiAttachmentDropZoneProps {
  isActive: boolean;
}

export default function KimiAttachmentDropZone({ isActive }: KimiAttachmentDropZoneProps) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center
      bg-background/80 backdrop-blur-sm border-2 border-dashed border-accent
      rounded-xl transition-all pointer-events-none">
      <div className="text-center">
        <div className="text-4xl mb-2">📂</div>
        <p className="text-foreground font-medium">Drop files to attach</p>
        <p className="text-foreground-secondary text-sm">
          Images, documents, or code files
        </p>
      </div>
    </div>
  );
}
