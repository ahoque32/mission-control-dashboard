'use client';

import ActivityFeed from '../../components/ActivityFeed';

export default function ActivityPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#ededed] mb-2">Activity Feed</h1>
        <p className="text-[#888]">Real-time timeline of all agent activity and operations</p>
      </div>

      {/* Full-page activity feed with filters and pagination */}
      <ActivityFeed fullPage />
    </div>
  );
}
