'use client';

import { useEffect } from 'react';
import Icon from '../components/ui/Icon';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <Icon name="exclamation-triangle" size={56} className="text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Something went wrong
        </h1>
        <p className="text-foreground-secondary mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-foreground-muted font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 glass-card text-foreground font-semibold hover:bg-white/15 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
