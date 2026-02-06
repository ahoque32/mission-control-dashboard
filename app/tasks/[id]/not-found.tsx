import Link from 'next/link';

export default function TaskNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/tasks" className="text-[#d4a574] hover:underline mb-6 inline-block">
          ← Back to Tasks
        </Link>

        <div className="text-center py-16">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-2xl font-bold text-[#ededed] mb-4">
            Task Not Found
          </h1>
          <p className="text-[#888] mb-8">
            The task you're looking for doesn't exist or may have been deleted.
          </p>
          <Link
            href="/tasks"
            className="px-6 py-3 bg-[#d4a574] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c9996a] transition-colors inline-block"
          >
            View All Tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
