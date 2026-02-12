'use client';

import { useState, useEffect } from 'react';
import { fetchComms, AgentComm } from '../lib/comms-api';
import {
  ArrowRight,
  RefreshCw,
  MessageSquare,
  GitMerge,
  Webhook,
  BrainCircuit,
} from 'lucide-react';

const channelConfig: {
  [key: string]: { icon: React.ElementType; color: string; label: string };
} = {
  convex_msg: {
    icon: MessageSquare,
    color: 'bg-blue-500',
    label: 'Convex Msg',
  },
  webhook: { icon: Webhook, color: 'bg-green-500', label: 'Webhook' },
  git_push: { icon: GitMerge, color: 'bg-purple-500', label: 'Git Push' },
  brain_prime_sync: {
    icon: BrainCircuit,
    color: 'bg-orange-500',
    label: 'Brain Sync',
  },
  default: { icon: MessageSquare, color: 'bg-gray-500', label: 'Unknown' },
};

const directionConfig: {
  [key: string]: { label: string };
} = {
  jhawk_to_anton: { label: 'JHawk → Anton' },
  anton_to_jhawk: { label: 'Anton → JHawk' },
  internal: { label: 'Internal' },
};

export default function CommunicationsFeed() {
  const [comms, setComms] = useState<AgentComm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ channel: '', direction: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await fetchComms();
      const sortedData = data.sort((a, b) => b.timestamp - a.timestamp);
      setComms(sortedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch communications data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const filteredComms = comms.filter(comm => {
      const channelMatch = !filters.channel || comm.channel === filters.channel;
      const directionMatch = !filters.direction || comm.direction === filters.direction;
      return channelMatch && directionMatch;
  });

  const getChannelInfo = (channel: string) =>
    channelConfig[channel] || channelConfig.default;
  const getDirectionInfo = (direction: string) =>
    directionConfig[direction] || { label: direction };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error)
    return (
      <div className="text-center p-8 text-red-500">
        Error: {error}
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Filters and Refresh */}
      <div className="flex justify-between items-center gap-4 p-4 glass-card rounded-lg">
        <div className="flex gap-4">
          {/* Channel Filter */}
          <select
            name="channel"
            value={filters.channel}
            onChange={handleFilterChange}
            className="bg-background-tertiary border border-border-primary text-foreground text-sm rounded-md focus:ring-accent focus:border-accent p-2"
          >
            <option value="">All Channels</option>
            {Object.entries(channelConfig).map(
              ([key, { label }]) =>
                key !== 'default' && (
                  <option key={key} value={key}>
                    {label}
                  </option>
                )
            )}
          </select>
          
          {/* Direction Filter */}
          <select
            name="direction"
            value={filters.direction}
            onChange={handleFilterChange}
            className="bg-background-tertiary border border-border-primary text-foreground text-sm rounded-md focus:ring-accent focus:border-accent p-2"
          >
            <option value="">All Directions</option>
            {Object.entries(directionConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-md hover:bg-background-tertiary transition-colors"
          aria-label="Refresh data"
        >
          <RefreshCw className="w-5 h-5 text-foreground-secondary" />
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredComms.map(comm => {
          const { icon: Icon, color, label } = getChannelInfo(comm.channel);
          const { label: directionLabel } = getDirectionInfo(comm.direction);

          return (
            <div
              key={comm.id}
              className="glass-card rounded-lg p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === comm.id ? null : comm.id)}
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </span>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{comm.from}</span>
                    <ArrowRight className="w-3 h-3 text-foreground-secondary" />
                    <span>{comm.to}</span>
                  </div>
                  <div className="text-xs text-foreground-secondary mt-1">
                    {new Date(comm.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 text-xs font-medium bg-background-tertiary rounded-md">
                    {label}
                  </span>
                </div>
              </div>
              
              {/* Message Preview */}
              <div className="mt-3 text-sm text-foreground-secondary pl-12">
                <p className="truncate">{comm.message}</p>
              </div>

              {/* Expanded View */}
              {expandedId === comm.id && (
                <div className="mt-4 pt-4 border-t border-border-primary pl-12">
                  <p className="text-sm whitespace-pre-wrap text-foreground">{comm.message}</p>
                  <div className="mt-3 text-xs text-foreground-secondary">
                    <strong>Direction:</strong> {directionLabel}
                  </div>
                  {Object.keys(comm.metadata).length > 0 && (
                    <pre className="mt-3 p-2 bg-background-tertiary rounded-md text-xs whitespace-pre-wrap">
                      {JSON.stringify(comm.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
