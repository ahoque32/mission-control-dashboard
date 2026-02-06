'use client';

import { useEffect } from 'react';

export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Documents page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Failed to Load Documents
          </h2>
          <p className="text-[#888] mb-6">
            There was a problem loading documents. This could be due to a
            network issue or a problem with the database connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c9996a] transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-[#1a1a1a] text-[#ededed] font-semibold rounded-lg border border-[#2a2a2a] hover:border-[#d4a574]/50 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
