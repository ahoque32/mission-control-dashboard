import Link from 'next/link';

export default function TaskNotFound() {
  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/tasks" className="text-emerald-400 hover:underline mb-6 inline-block">
          ← Back to Tasks
        </Link>

        <div className="text-center py-16">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Task Not Found
          </h1>
          <p className="text-foreground-secondary mb-8">
            The task you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </p>
          <Link
            href="/tasks"
            className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-400 transition-colors inline-block"
          >
            View All Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
