'use client';

import Icon from '../../components/ui/Icon';

export default function KimiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="glass-card p-8 text-center">
        <Icon name="exclamation-triangle" size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Kimi Portal Error
        </h2>
        <p className="text-foreground-secondary mb-6">
          {error.message || 'Something went wrong loading the Kimi Portal.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20
                     rounded-xl hover:bg-emerald-500/25 transition-all font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
