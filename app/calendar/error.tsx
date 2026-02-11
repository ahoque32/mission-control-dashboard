'use client';

import { useEffect } from 'react';
import Icon from '../../components/ui/Icon';

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
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
        <div className="mb-4 flex justify-center">
          <Icon name="calendar3" size={40} className="text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-red-400 mb-2">
          Failed to Load Calendar
        </h2>
        <p className="text-foreground-secondary mb-6">
          There was a problem loading the calendar view. This could be due to a
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
