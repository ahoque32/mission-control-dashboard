'use client';

import { useActivity } from '../../lib/firebase';
import { Activity } from '../../types';

// Note: Metadata must be exported from a Server Component.
// For client components, we set document.title in useEffect if needed,
// or move metadata to a parent layout.tsx

// Activity type icons and colors - ALIGNED WITH schema.js ACTIVITY_TYPE
const ACTIVITY_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  // Task lifecycle
  task_created: { icon: '📝', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  task_updated: { icon: '✏️', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  task_assigned: { icon: '👤', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  
  // Communication
  message_sent: { icon: '💬', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  document_created: { icon: '📄', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  
  // Agent status
  agent_status_changed: { icon: '🔄', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  
  // Session lifecycle
  session_created: { icon: '🔗', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  session_state_changed: { icon: '🔄', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  
  // Agent work tracking (Ralph agents)
  agent_task_started: { icon: '🚀', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  agent_task_completed: { icon: '✅', color: 'text-green-400', bg: 'bg-green-500/20' },
  agent_task_failed: { icon: '❌', color: 'text-red-400', bg: 'bg-red-500/20' },
  agent_run_started: { icon: '▶️', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  agent_run_completed: { icon: '🏁', color: 'text-green-400', bg: 'bg-green-500/20' },
  
  // Fallback for any unhandled types
  custom: { icon: '📌', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

function formatTimestamp(timestamp: any): string {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function ActivityCard({ activity }: { activity: Activity }) {
  const style = ACTIVITY_STYLES[activity.type] || ACTIVITY_STYLES.custom;
  
  return (
    <div className="flex items-start gap-4 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#3a3a3a] transition-colors">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center text-lg`}>
        {style.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${style.color}`}>
            {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          {activity.agentId && (
            <span className="text-xs text-[#666] font-mono">
              @{activity.agentId}
            </span>
          )}
        </div>
        <p className="text-sm text-[#ededed]">{activity.message}</p>
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 text-xs text-[#666] font-mono">
            {JSON.stringify(activity.metadata)}
          </div>
        )}
      </div>
      
      {/* Timestamp */}
      <div className="text-xs text-[#666] whitespace-nowrap">
        {formatTimestamp(activity.createdAt)}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { activities, loading, error } = useActivity();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#ededed] mb-2">Activity Feed</h1>
        <p className="text-[#888]">Real-time activity from all agents and operations</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4a574]"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          Error loading activities: {error.message}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && activities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-[#ededed] mb-2">No activity yet</h3>
          <p className="text-[#888]">Activity will appear here when agents complete tasks or operations run.</p>
        </div>
      )}

      {/* Activity List */}
      {!loading && !error && activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
