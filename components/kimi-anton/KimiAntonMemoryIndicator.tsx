'use client';

interface KimiAntonMemoryIndicatorProps {
  profileVersion: string | null;
  memoryCount: number;
}

export default function KimiAntonMemoryIndicator({
  profileVersion,
  memoryCount,
}: KimiAntonMemoryIndicatorProps) {
  const profileLoaded = profileVersion !== null;
  const memoryLoaded = memoryCount > 0;

  let dotColor = 'bg-foreground-muted';
  let statusText = 'Memory: Loading...';

  if (profileLoaded && memoryLoaded) {
    dotColor = 'bg-emerald-500';
    statusText = `Anton Profile ✓ (v${profileVersion}) + Local (${memoryCount})`;
  } else if (profileLoaded && !memoryLoaded) {
    dotColor = 'bg-yellow-500';
    statusText = `Anton Profile ✓ (v${profileVersion}) + Local (empty)`;
  } else if (!profileLoaded) {
    dotColor = 'bg-red-500';
    statusText = 'Profile loading...';
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{statusText}</span>
    </div>
  );
}
