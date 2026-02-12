"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Icon from "./ui/Icon";

const statusConfig: Record<string, { color: string; ring: string; label: string; emoji: string }> = {
  active: {
    color: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    label: "Active",
    emoji: "🟢",
  },
  waiting: {
    color: "bg-amber-500",
    ring: "ring-amber-500/30",
    label: "Waiting",
    emoji: "🟡",
  },
  failed: {
    color: "bg-red-500",
    ring: "ring-red-500/30",
    label: "Failed",
    emoji: "🔴",
  },
  idle: {
    color: "bg-gray-400",
    ring: "ring-gray-400/30",
    label: "Idle",
    emoji: "⚪",
  },
};

const agentIcons: Record<string, string> = {
  JHawk: "cpu",
  Ralph: "robot",
  Scout: "binoculars",
  Archivist: "book",
  Sentinel: "shield-check",
};

export function AgentPulse() {
  const agentPulse = useQuery(api.tasks.getAgentPulse);

  if (!agentPulse) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-white/60 mb-3">Agent Pulse</h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  type AgentPulseEntry = { status: string; lastActivity: number; currentTask: string | null; recentTasks: number; recentFailed: number; lastSeen: number };
  const agents = (Object.entries(agentPulse) as [string, AgentPulseEntry][]).sort(([, a], [, b]) => {
    // Active first, then by last activity
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return b.lastActivity - a.lastActivity;
  });

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-white/60 mb-3">Agent Pulse</h3>
      <div className="space-y-2">
        {agents.map(([name, data]) => {
          const config = statusConfig[data.status];
          const iconName = agentIcons[name] || "robot";

          return (
            <div
              key={name}
              className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {/* Status indicator with pulse animation for active */}
              <div className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${config.color} ${
                    data.status === "active" ? "animate-pulse" : ""
                  }`}
                />
                {data.status === "active" && (
                  <div
                    className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${config.color} animate-ping opacity-75`}
                  />
                )}
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon name={iconName} size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white/90">
                    {name}
                  </span>
                </div>
                {data.currentTask && (
                  <p className="text-xs text-white/50 truncate">
                    {data.currentTask}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="text-right text-xs text-white/40">
                {data.recentTasks > 0 && (
                  <div>
                    {data.recentTasks} task{data.recentTasks !== 1 ? "s" : ""}{" "}
                    (24h)
                  </div>
                )}
                {data.recentFailed > 0 && (
                  <div className="text-red-400">
                    {data.recentFailed} failed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for sidebar
export function AgentPulseCompact() {
  const agentPulse = useQuery(api.tasks.getAgentPulse);

  if (!agentPulse) return null;

  const activeCount = Object.values(agentPulse).filter(
    (a: any) => a.status === "active"
  ).length;
  const failedCount = Object.values(agentPulse).filter(
    (a: any) => a.status === "failed"
  ).length;

  return (
    <div className="flex items-center gap-2 text-xs">
      {activeCount > 0 && (
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {activeCount} active
        </span>
      )}
      {failedCount > 0 && (
        <span className="flex items-center gap-1 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {failedCount} failed
        </span>
      )}
      {activeCount === 0 && failedCount === 0 && (
        <span className="text-white/40">All idle</span>
      )}
    </div>
  );
}
