import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Page Not Found
        </h1>
        <p className="text-foreground-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/tasks"
            className="px-6 py-3 glass-card text-foreground font-semibold hover:bg-white/15 transition-colors"
          >
            View Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
