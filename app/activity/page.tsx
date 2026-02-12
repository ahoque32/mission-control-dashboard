'use client';

import { useState } from 'react';
import ActivityFeed from '../../components/ActivityFeed';
import CommunicationsFeed from '../../components/CommunicationsFeed';

type TabType = 'activity' | 'communications';

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('activity');

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {activeTab === 'activity' ? 'Activity Feed' : 'Agent Communications'}
        </h1>
        <p className="text-sm sm:text-base text-foreground-secondary">
          {activeTab === 'activity'
            ? 'Real-time timeline of all agent activity and operations'
            : 'Cross-system communication log between JHawk, Anton, and squad agents'}
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-1 mb-6 p-1 glass-card w-fit">
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-sm font-medium rounded transition-all ${
            activeTab === 'activity'
              ? 'bg-accent text-white shadow-sm'
              : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
          }`}
        >
          📋 Activity Feed
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          className={`px-4 py-2 text-sm font-medium rounded transition-all ${
            activeTab === 'communications'
              ? 'bg-accent text-white shadow-sm'
              : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
          }`}
        >
          💬 Communications
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'activity' ? (
        <ActivityFeed fullPage />
      ) : (
        <CommunicationsFeed />
      )}
    </div>
  );
}
