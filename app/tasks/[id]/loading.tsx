export default function TaskDetailLoading() {
  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Link Skeleton */}
        <div className="h-4 w-28 bg-white/5 rounded animate-pulse mb-6" />

        {/* Task Header Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse mb-4" />

          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Comments Section Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-l-2 border-white/10 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-1" />
                <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
