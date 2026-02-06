export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-[#1a1a1a] rounded animate-pulse mb-3" />
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-20 bg-[#1a1a1a] rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Agent Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-[#2a2a2a] rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-6 w-32 bg-[#2a2a2a] rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-[#2a2a2a] rounded-full animate-pulse" />
              </div>

              {/* Current Task Skeleton */}
              <div className="mb-5 p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                <div className="h-3 w-24 bg-[#2a2a2a] rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="text-center p-2 bg-[#0f0f0f] rounded-lg">
                    <div className="h-6 w-8 bg-[#2a2a2a] rounded animate-pulse mx-auto mb-1" />
                    <div className="h-3 w-12 bg-[#2a2a2a] rounded animate-pulse mx-auto" />
                  </div>
                ))}
              </div>

              {/* Timeline Skeleton */}
              <div className="flex gap-0.5 h-10">
                {Array.from({ length: 24 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 bg-[#2a2a2a] rounded-sm animate-pulse"
                    style={{ height: `${20 + Math.random() * 60}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
