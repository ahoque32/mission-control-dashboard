import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-[#ededed] mb-4">
          Page Not Found
        </h1>
        <p className="text-[#888] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c9996a] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/tasks"
            className="px-6 py-3 bg-[#1a1a1a] text-[#ededed] font-semibold rounded-lg border border-[#2a2a2a] hover:border-[#d4a574]/50 transition-colors"
          >
            View Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
