export default function DocumentsLoading() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-3" />
          <div className="h-4 w-32 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
        </div>

        {/* Type Filter Skeleton */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 glass-card animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Document Groups Skeleton */}
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
              <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/5 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-white/5 rounded animate-pulse mb-2" />
                      <div className="flex gap-2 mb-2">
                        <div className="h-5 w-20 bg-white/5 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-white/5 rounded animate-pulse" />
                      </div>
                      <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
