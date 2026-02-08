export default function SearchLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-32 bg-[#1a1a1a] rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-[#1a1a1a] rounded animate-pulse" />
      </div>

      {/* Search Input Skeleton */}
      <div className="h-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl animate-pulse mb-6" />

      {/* Results Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <div className="h-4 w-48 bg-[#2a2a2a] rounded animate-pulse mb-2" />
                  <div className="h-3 w-72 bg-[#2a2a2a] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
