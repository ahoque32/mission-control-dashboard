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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/tasks" className="text-[#d4a574] hover:underline mb-6 inline-block">
          ← Back to Tasks
        </Link>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Task
          </h2>
          <p className="text-[#888] mb-6">
            There was a problem loading this task. The task may have been deleted
            or there could be a connection issue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c9996a] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/tasks"
              className="px-6 py-3 bg-[#1a1a1a] text-[#ededed] font-semibold rounded-lg border border-[#2a2a2a] hover:border-[#d4a574]/50 transition-colors"
            >
              View All Tasks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
