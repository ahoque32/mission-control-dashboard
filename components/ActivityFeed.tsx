'use client';

import { useMemo, useState } from 'react';
import { useActivityPaginated, useAgents } from '../lib/convex';
import { Activity, ActivityType } from '../types';
import Icon from './ui/Icon';

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(timestamp: any): string {
  const now = Date.now();
  const then = typeof timestamp === 'number' ? timestamp : (timestamp?.toMillis ? timestamp.toMillis() : 0);
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

function formatFullDate(timestamp: any): string {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(typeof timestamp === 'number' ? timestamp : 0);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getDateGroupLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (activityDate.getTime() === today.getTime()) return 'Today';
  if (activityDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// ============================================================================
// Activity Styles
// ============================================================================

interface ActivityStyle {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  label: string;
}

const ACTIVITY_STYLES: Record<string, ActivityStyle> = {
  task_completed: { icon: 'check-circle-fill', bgColor: 'bg-green-500/10', textColor: 'text-green-400', borderColor: 'border-green-500/20', label: 'Task Completed' },
  task_started: { icon: 'rocket-takeoff', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', label: 'Task Started' },
  research: { icon: 'search', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', label: 'Research' },
  deployment: { icon: 'send', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', borderColor: 'border-orange-500/20', label: 'Deployment' },
  code_review: { icon: 'eye', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/20', label: 'Code Review' },
  system_maintenance: { icon: 'wrench', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', borderColor: 'border-gray-500/20', label: 'Maintenance' },
  communication: { icon: 'chat', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/20', label: 'Communication' },
  monitoring: { icon: 'graph-up', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/20', label: 'Monitoring' },
  spawn_completed: { icon: 'tree', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20', label: 'Spawn Completed' },
  spawn_failed: { icon: 'exclamation-triangle-fill', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20', label: 'Spawn Failed' },
  general: { icon: 'pencil-square', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20', label: 'General' },
  // Kimi Portal v2 types
  kimi_session_started: { icon: 'play-circle', bgColor: 'bg-teal-500/10', textColor: 'text-teal-400', borderColor: 'border-teal-500/20', label: 'Kimi Session' },
  kimi_session_closed: { icon: 'stop-circle', bgColor: 'bg-teal-500/10', textColor: 'text-teal-400', borderColor: 'border-teal-500/20', label: 'Session Closed' },
  kimi_chat_message: { icon: 'chat-dots', bgColor: 'bg-teal-500/10', textColor: 'text-teal-400', borderColor: 'border-teal-500/20', label: 'Kimi Chat' },
  kimi_delegation_created: { icon: 'share', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/20', label: 'Delegation' },
  kimi_delegation_completed: { icon: 'check2-all', bgColor: 'bg-indigo-500/10', textColor: 'text-indigo-400', borderColor: 'border-indigo-500/20', label: 'Delegation Done' },
  kimi_delegation_failed: { icon: 'x-circle', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20', label: 'Delegation Failed' },
  kimi_model_override: { icon: 'cpu', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/20', label: 'Model Override' },
  kimi_github_branch: { icon: 'diagram-3', bgColor: 'bg-violet-500/10', textColor: 'text-violet-400', borderColor: 'border-violet-500/20', label: 'Branch Created' },
  kimi_github_commit: { icon: 'file-diff', bgColor: 'bg-violet-500/10', textColor: 'text-violet-400', borderColor: 'border-violet-500/20', label: 'Commit' },
  kimi_github_push: { icon: 'cloud-upload', bgColor: 'bg-violet-500/10', textColor: 'text-violet-400', borderColor: 'border-violet-500/20', label: 'Push' },
  kimi_github_pr: { icon: 'box-arrow-up-right', bgColor: 'bg-violet-500/10', textColor: 'text-violet-400', borderColor: 'border-violet-500/20', label: 'Pull Request' },
  kimi_permission_denied: { icon: 'shield-x', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20', label: 'Permission Denied' },
  kimi_escalation_created: { icon: 'exclamation-diamond', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', borderColor: 'border-orange-500/20', label: 'Escalation' },
  kimi_memory_write: { icon: 'database', bgColor: 'bg-teal-500/10', textColor: 'text-teal-400', borderColor: 'border-teal-500/20', label: 'Memory Write' },
  // Legacy types
  agent_task_completed: { icon: 'check-circle-fill', bgColor: 'bg-green-500/10', textColor: 'text-green-400', borderColor: 'border-green-500/20', label: 'Task Completed' },
  agent_task_started: { icon: 'rocket-takeoff', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', label: 'Task Started' },
  agent_task_failed: { icon: 'x-circle-fill', bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/20', label: 'Task Failed' },
  agent_run_started: { icon: 'play-fill', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', label: 'Run Started' },
  agent_run_completed: { icon: 'flag-fill', bgColor: 'bg-green-500/10', textColor: 'text-green-400', borderColor: 'border-green-500/20', label: 'Run Completed' },
  session_created: { icon: 'link-45deg', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', label: 'Session Created' },
  session_state_changed: { icon: 'arrow-repeat', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', label: 'Session Changed' },
  task_created: { icon: 'pencil-square', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', label: 'Task Created' },
  task_updated: { icon: 'pencil-square', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/20', label: 'Task Updated' },
  task_assigned: { icon: 'person-fill', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/20', label: 'Task Assigned' },
  message_sent: { icon: 'chat', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400', borderColor: 'border-purple-500/20', label: 'Message Sent' },
  document_created: { icon: 'file-earmark-text', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', label: 'Document Created' },
  agent_status_changed: { icon: 'arrow-repeat', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/20', label: 'Status Changed' },
};

const DEFAULT_STYLE: ActivityStyle = {
  icon: 'pin-map-fill', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20', label: 'Activity'
};

function getActivityStyle(type: string): ActivityStyle {
  return ACTIVITY_STYLES[type] || DEFAULT_STYLE;
}

// All supported filter types
const FILTER_TYPES: { value: string; label: string }[] = [
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'task_started', label: 'Task Started' },
  { value: 'research', label: 'Research' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'system_maintenance', label: 'Maintenance' },
  { value: 'communication', label: 'Communication' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'spawn_completed', label: 'Spawn Completed' },
  { value: 'spawn_failed', label: 'Spawn Failed' },
  { value: 'general', label: 'General' },
  { value: 'agent_task_completed', label: 'Agent Task Completed' },
  { value: 'agent_task_started', label: 'Agent Task Started' },
  { value: 'agent_task_failed', label: 'Agent Task Failed' },
  { value: 'agent_run_started', label: 'Agent Run Started' },
  { value: 'agent_run_completed', label: 'Agent Run Completed' },
  // Kimi Portal v2
  { value: 'kimi_session_started', label: 'Kimi Session' },
  { value: 'kimi_chat_message', label: 'Kimi Chat' },
  { value: 'kimi_delegation_created', label: 'Kimi Delegation' },
  { value: 'kimi_delegation_completed', label: 'Delegation Done' },
  { value: 'kimi_delegation_failed', label: 'Delegation Failed' },
  { value: 'kimi_model_override', label: 'Model Override' },
  { value: 'kimi_github_branch', label: 'GitHub Branch' },
  { value: 'kimi_github_pr', label: 'GitHub PR' },
  { value: 'kimi_permission_denied', label: 'Permission Denied' },
  { value: 'kimi_escalation_created', label: 'Escalation' },
  { value: 'kimi_memory_write', label: 'Kimi Memory' },
];

// ============================================================================
// Props
// ============================================================================

interface ActivityFeedProps {
  /** Show filters and full timeline view */
  fullPage?: boolean;
  /** Max items to show (for dashboard widget mode) */
  maxItems?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function ActivityFeed({ fullPage = false, maxItems }: ActivityFeedProps) {
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const pageSize = fullPage ? 25 : (maxItems || 10);

  const { activities, loading, error, hasMore, loadMore, loadingMore } = useActivityPaginated(
    pageSize,
    agentFilter || undefined,
    typeFilter || undefined
  );
  const { agents } = useAgents();

  // Build agent lookup map
  const agentMap = useMemo(() => {
    const map: Record<string, typeof agents[0]> = {};
    agents.forEach(agent => {
      map[agent.id] = agent;
      if (agent.name) {
        map[agent.name.toLowerCase()] = agent;
        map[agent.name] = agent;
      }
      if (agent.sessionKey) {
        map[agent.sessionKey] = agent;
        const match = agent.sessionKey.match(/^agent:([^:]+):/);
        if (match) map[match[1]] = agent;
      }
    });
    return map;
  }, [agents]);

  // Get unique agent names for filter dropdown
  const agentNames = useMemo(() => {
    const names = new Set<string>();
    activities.forEach(a => {
      const agent = agentMap[a.agentId];
      const name = agent?.name || a.metadata?.agentName || a.agentId;
      if (name) names.add(name);
    });
    // Also add all known agents
    agents.forEach(a => names.add(a.name));
    return Array.from(names).sort();
  }, [activities, agents, agentMap]);

  // Client-side filtering
  const filteredActivities = useMemo(() => {
    let result = activities;
    if (agentFilter) {
      result = result.filter(a => {
        const agent = agentMap[a.agentId];
        const name = agent?.name || a.metadata?.agentName || a.agentId;
        return name === agentFilter || a.agentId === agentFilter;
      });
    }
    if (typeFilter) {
      result = result.filter(a => a.type === typeFilter);
    }
    return result;
  }, [activities, agentFilter, typeFilter, agentMap]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { label: string; activities: Activity[] }[] = [];
    let currentLabel = '';
    let currentGroup: Activity[] = [];

    filteredActivities.forEach(activity => {
      const date = activity.createdAt?.toDate ? activity.createdAt.toDate() : (typeof activity.createdAt === 'number' ? new Date(activity.createdAt) : new Date());
      const label = getDateGroupLabel(date);
      if (label !== currentLabel) {
        if (currentGroup.length > 0) {
          groups.push({ label: currentLabel, activities: currentGroup });
        }
        currentLabel = label;
        currentGroup = [activity];
      } else {
        currentGroup.push(activity);
      }
    });
    if (currentGroup.length > 0) {
      groups.push({ label: currentLabel, activities: currentGroup });
    }
    return groups;
  }, [filteredActivities]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading activity">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-foreground-secondary">Loading activity...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <Icon name="exclamation-triangle" size={40} className="text-yellow-400" />
          </div>
          <p className="text-sm text-status-error mb-1">Failed to load activity</p>
          <p className="text-xs text-foreground-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters - only in full page mode */}
      {fullPage && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="glass-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
          >
            <option value="">All Agents</option>
            {agentNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="glass-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
          >
            <option value="">All Types</option>
            {FILTER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Active filter indicator */}
          {(agentFilter || typeFilter) && (
            <button
              onClick={() => { setAgentFilter(''); setTypeFilter(''); }}
              className="text-xs text-accent hover:text-accent-hover px-3 py-2 self-center transition-colors"
            >
              Clear filters ✕
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {filteredActivities.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <Icon name="mailbox2" size={40} className="text-foreground-muted" />
            </div>
            <p className="text-sm text-foreground-secondary mb-1">
              {agentFilter || typeFilter ? 'No activities match your filters' : 'No activity yet'}
            </p>
            <p className="text-xs text-foreground-muted">
              {agentFilter || typeFilter ? 'Try adjusting your filters' : 'Activity will appear here as agents work'}
            </p>
          </div>
        </div>
      )}

      {/* Grouped Timeline */}
      <div className="space-y-6" role="feed" aria-label="Activity feed" aria-busy={loading}>
        {groupedActivities.map((group) => (
          <div key={group.label}>
            {/* Date header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-foreground-muted">{group.activities.length} items</span>
              </div>
            </div>

            {/* Activities in this group */}
            <div className="space-y-2">
              {group.activities.map((activity) => {
                const agent = agentMap[activity.agentId];
                const agentEmoji = agent?.emoji;
                const agentName = activity.metadata?.agentName || agent?.name || activity.agentId || 'Unknown';
                const style = getActivityStyle(activity.type);
                const metadata = activity.metadata || {};
                const duration = metadata.duration as number | undefined;
                const taskName = metadata.taskName as string | undefined;
                const errorSummary = metadata.errorSummary as string | undefined;

                return (
                  <article
                    key={activity.id}
                    role="article"
                    aria-label={`Activity by ${agentName}: ${activity.message}`}
                    className="glass-card p-3 sm:p-4 hover:border-accent/30 transition-all flex items-start gap-2.5 sm:gap-3 card-hover"
                  >
                    {/* Agent Avatar */}
                    <div className="w-10 h-10 rounded-full bg-background-secondary border border-border flex items-center justify-center flex-shrink-0">
                      {agentEmoji ? (
                        <span className="text-xl">{agentEmoji}</span>
                      ) : (
                        <Icon name="robot" size={20} className="text-emerald-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {agentName}
                        </span>
                        <span className="text-xs text-foreground-muted font-mono whitespace-nowrap">
                          {formatFullDate(activity.createdAt)}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-foreground-secondary leading-relaxed">{activity.message}</p>

                      {/* Task name */}
                      {taskName && (
                        <p className="text-xs text-foreground-muted mt-1 italic">Task: {taskName}</p>
                      )}

                      {/* Error summary */}
                      {errorSummary && (
                        <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-xs text-red-400">
                          {errorSummary}
                        </div>
                      )}

                      {/* Badges */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${style.bgColor} ${style.textColor} border ${style.borderColor}`}>
                          <Icon name={style.icon} size={12} />
                          {style.label}
                        </span>
                        {duration !== undefined && duration > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-background-tertiary text-foreground-secondary border border-border">
                            <Icon name="stopwatch" size={12} /> {formatDuration(duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {fullPage && hasMore && filteredActivities.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 glass-card text-foreground hover:border-accent/50 hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              'Load More Activities'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
