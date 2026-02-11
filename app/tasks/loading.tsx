export default function TasksLoading() {
  return (
    <div className="min-h-screen p-6">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-9 w-32 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-24 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="h-12 w-32 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 bg-white/[0.04] border border-white/10 rounded-2xl"
          >
            <div className="p-3 border-b border-white/10">
              <div className="h-5 w-24 bg-white/5 rounded-xl animate-pulse" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 2 + (i % 3) }).map((_, j) => (
                <div
                  key={j}
                  className="h-20 bg-white/[0.03] border border-white/10 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
