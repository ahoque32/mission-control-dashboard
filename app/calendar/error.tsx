'use client';

import { useEffect } from 'react';

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Calendar page error:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-semibold text-red-400 mb-2">
          Failed to Load Calendar
        </h2>
        <p className="text-[#888] mb-6">
          There was a problem loading the calendar view. This could be due to a
          network issue or a problem with the database connection.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c9996a] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
