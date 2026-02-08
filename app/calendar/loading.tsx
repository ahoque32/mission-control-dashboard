export default function CalendarLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-[#1a1a1a] rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-[#1a1a1a] rounded animate-pulse" />
      </div>

      {/* Navigation Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <div className="h-10 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
          <div className="h-10 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
          <div className="h-10 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
        </div>
        <div className="h-6 w-48 bg-[#1a1a1a] rounded animate-pulse" />
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 bg-[#111]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 border-b border-r border-[#2a2a2a]">
              <div className="h-4 w-12 bg-[#2a2a2a] rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8">
            {Array.from({ length: 8 }).map((_, j) => (
              <div key={j} className="h-12 border-r border-b border-[#2a2a2a] p-1">
                {Math.random() > 0.7 && (
                  <div className="h-5 bg-[#2a2a2a] rounded animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
