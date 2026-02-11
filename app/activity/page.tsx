'use client';

import ActivityFeed from '../../components/ActivityFeed';

export default function ActivityPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Activity Feed</h1>
        <p className="text-sm sm:text-base text-foreground-secondary">Real-time timeline of all agent activity and operations</p>
      </div>

      {/* Full-page activity feed with filters and pagination */}
      <ActivityFeed fullPage />
    </div>
  );
}
