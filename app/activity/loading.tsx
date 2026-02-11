export default function ActivityLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/5 border border-white/10 rounded-xl animate-pulse mb-2" />
        <div className="h-4 w-72 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
      </div>

      {/* Activity Items Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 glass-card"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
