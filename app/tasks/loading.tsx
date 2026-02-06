export default function TasksLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-9 w-32 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="h-4 w-24 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        <div className="h-12 w-32 bg-[#1a1a1a] rounded-lg animate-pulse" />
      </div>

      {/* Filters Skeleton */}
      <div className="mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
        <div className="flex flex-wrap gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[200px]">
              <div className="h-4 w-16 bg-[#2a2a2a] rounded animate-pulse mb-2" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-8 w-20 bg-[#0a0a0a] rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg"
          >
            <div className="p-3 border-b border-[#2a2a2a]">
              <div className="h-5 w-24 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 2 + (i % 3) }).map((_, j) => (
                <div
                  key={j}
                  className="h-20 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
