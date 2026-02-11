'use client';

import { useEffect } from 'react';

export default function AgentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Agents page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Agents
          </h2>
          <p className="text-foreground-secondary mb-6">
            There was a problem loading agent information. This could be due to a
            network issue or a problem with the database connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-6 py-3 glass-card text-foreground font-semibold rounded-xl border border-white/10 hover:border-emerald-500/30 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
