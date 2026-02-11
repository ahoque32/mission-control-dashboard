'use client';

import { useEffect } from 'react';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Search page error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-red-400 mb-2">
          Search Unavailable
        </h2>
        <p className="text-foreground-secondary mb-6">
          There was a problem loading search. This could be due to a
          network issue or a problem with the database connection.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
