'use client';

import GlobalSearch from '../../components/GlobalSearch';

export default function SearchPage() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">🔍 Search</h1>
        <p className="text-sm sm:text-base text-foreground-secondary">Search across tasks, activities, and documents</p>
      </div>

      <GlobalSearch autoFocus />
    </div>
  );
}
