'use client';

import GlobalSearch from '../../components/GlobalSearch';

export default function SearchPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#ededed] mb-2">🔍 Search</h1>
        <p className="text-[#888]">Search across tasks, activities, and documents</p>
      </div>

      <GlobalSearch autoFocus />
    </div>
  );
}
