'use client';

import { useState } from 'react';
import Icon from '../../components/ui/Icon';

// Mock data
const agentMetrics = [
  { name: 'Ralph', tasksCompleted: 142, avgResponseTime: '1.2s', uptime: 99.1, errorRate: 0.8 },
  { name: 'Dante', tasksCompleted: 238, avgResponseTime: '0.8s', uptime: 99.7, errorRate: 0.3 },
  { name: 'Leo', tasksCompleted: 89, avgResponseTime: '2.1s', uptime: 97.5, errorRate: 2.1 },
  { name: 'Sentinel', tasksCompleted: 312, avgResponseTime: '0.4s', uptime: 99.9, errorRate: 0.1 },
  { name: 'Scout', tasksCompleted: 67, avgResponseTime: '3.4s', uptime: 95.2, errorRate: 4.2 },
];

const throughputData = [
  { day: 'Mon', created: 24, completed: 21 },
  { day: 'Tue', created: 31, completed: 28 },
  { day: 'Wed', created: 18, completed: 22 },
  { day: 'Thu', created: 29, completed: 27 },
  { day: 'Fri', created: 35, completed: 30 },
  { day: 'Sat', created: 12, completed: 15 },
  { day: 'Sun', created: 8, completed: 10 },
];

const maxThroughput = Math.max(...throughputData.flatMap(d => [d.created, d.completed]));

export default function MetricsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const totalTasks = agentMetrics.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const avgUptime = (agentMetrics.reduce((sum, a) => sum + a.uptime, 0) / agentMetrics.length).toFixed(1);
  const avgErrorRate = (agentMetrics.reduce((sum, a) => sum + a.errorRate, 0) / agentMetrics.length).toFixed(1);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Metrics</h1>
        <p className="text-foreground-secondary mt-1">Agent performance & task throughput</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Tasks Completed', value: totalTasks, icon: 'check-circle' },
          { label: 'Avg Uptime', value: `${avgUptime}%`, icon: 'arrow-up-circle' },
          { label: 'Avg Error Rate', value: `${avgErrorRate}%`, icon: 'exclamation-triangle' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon name={stat.icon as any} size={20} className="text-emerald-400" />
              <span className="text-xs text-foreground-muted uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Task Throughput Chart (bar chart with divs) */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Task Throughput (7-day)</h2>
        <div className="flex items-end gap-3 h-48">
          {throughputData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end w-full justify-center h-40">
                <div
                  className="w-3 bg-emerald-500/70 rounded-t transition-all"
                  style={{ height: `${(d.completed / maxThroughput) * 100}%` }}
                  title={`Completed: ${d.completed}`}
                />
                <div
                  className="w-3 bg-blue-500/50 rounded-t transition-all"
                  style={{ height: `${(d.created / maxThroughput) * 100}%` }}
                  title={`Created: ${d.created}`}
                />
              </div>
              <span className="text-xs text-foreground-muted">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-foreground-secondary">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500/70 rounded" /> Completed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500/50 rounded" /> Created</span>
        </div>
      </div>

      {/* Agent Performance Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Agent Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agentMetrics.map((agent) => (
            <div
              key={agent.name}
              className={`glass-card p-5 cursor-pointer transition-all hover:border-emerald-500/30 ${
                selectedAgent === agent.name ? 'border-emerald-500/50' : ''
              }`}
              onClick={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">{agent.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Tasks Completed</span>
                  <span className="text-foreground font-mono">{agent.tasksCompleted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Avg Response Time</span>
                  <span className="text-foreground font-mono">{agent.avgResponseTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Uptime</span>
                  <span className={`font-mono ${agent.uptime >= 99 ? 'text-emerald-400' : agent.uptime >= 97 ? 'text-amber-400' : 'text-red-400'}`}>
                    {agent.uptime}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Error Rate</span>
                  <span className={`font-mono ${agent.errorRate <= 1 ? 'text-emerald-400' : agent.errorRate <= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                    {agent.errorRate}%
                  </span>
                </div>
                {/* Error rate bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${agent.errorRate <= 1 ? 'bg-emerald-500' : agent.errorRate <= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(agent.errorRate * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
