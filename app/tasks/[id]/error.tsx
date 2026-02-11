'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function TaskDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Task detail page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/tasks" className="text-emerald-400 hover:underline mb-6 inline-block">
          ← Back to Tasks
        </Link>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Task
          </h2>
          <p className="text-foreground-secondary mb-6">
            There was a problem loading this task. The task may have been deleted
            or there could be a connection issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/tasks"
              className="px-6 py-3 bg-white/5 text-foreground font-semibold rounded-lg border border-white/10 hover:border-emerald-500/50 transition-colors"
            >
              View All Tasks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
