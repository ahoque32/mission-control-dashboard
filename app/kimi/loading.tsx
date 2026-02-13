export default function KimiLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="h-7 w-64 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse" />
      </div>

      {/* Mode selector skeleton */}
      <div className="mb-6">
        <div className="h-10 w-56 bg-white/5 rounded-xl animate-pulse" />
      </div>

      {/* Chat area skeleton */}
      <div className="glass-card p-0 overflow-hidden" style={{ height: '500px' }}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Messages area */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-end">
            <div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse" />
          </div>
          <div className="flex justify-start">
            <div className="h-24 w-72 bg-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Input skeleton */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
