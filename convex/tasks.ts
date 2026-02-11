import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.string(),
    priority: v.string(),
    assigneeIds: v.array(v.string()),
    createdBy: v.string(),
    dueDate: v.union(v.number(), v.null()),
    tags: v.array(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: args.createdAt ?? now,
      updatedAt: args.updatedAt ?? now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigneeIds: v.optional(v.array(v.string())),
    dueDate: v.optional(v.union(v.number(), v.null())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    // Filter out undefined values
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    updates.updatedAt = Date.now();
    await ctx.db.patch(id, updates);
  },
});

// ========== SPAWN TASK TRACKING ==========

// Create a task when an agent is spawned
export const createSpawnTask = mutation({
  args: {
    title: v.string(),
    agentName: v.string(),
    sessionKey: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description ?? "",
      status: "running",
      priority: "medium",
      assigneeIds: [args.agentName],
      createdBy: "jhawk-sys",
      dueDate: null,
      tags: ["spawn", args.agentName.toLowerCase()],
      createdAt: now,
      updatedAt: now,
      // Spawn-specific fields
      isSpawnTask: true,
      sessionKey: args.sessionKey,
      agentName: args.agentName,
      spawnedAt: now,
    });
  },
});

// Update spawn task when it completes or fails
export const completeSpawnTask = mutation({
  args: {
    sessionKey: v.string(),
    status: v.string(), // "completed" or "failed"
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find task by sessionKey
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_sessionKey", (q) => q.eq("sessionKey", args.sessionKey))
      .first();

    if (!task) {
      // No task found - might be a spawn that wasn't tracked
      return null;
    }

    const now = Date.now();
    await ctx.db.patch(task._id, {
      status: args.status,
      completedAt: now,
      updatedAt: now,
      result: args.result,
    });

    return task._id;
  },
});

// Get all currently running spawn tasks
export const getActiveSpawns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .filter((q) => q.eq(q.field("isSpawnTask"), true))
      .collect();
  },
});

// Get agent pulse - real-time status for each agent
export const getAgentPulse = query({
  args: {},
  handler: async (ctx) => {
    // Get recent spawn tasks (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentTasks = await ctx.db
      .query("tasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("isSpawnTask"), true),
          q.gte(q.field("createdAt"), oneDayAgo)
        )
      )
      .collect();

    // Group by agent and determine status
    const agentStatus: Record<
      string,
      {
        status: "active" | "waiting" | "failed" | "idle";
        currentTask: string | null;
        lastActivity: number;
        recentTasks: number;
        recentFailed: number;
      }
    > = {};

    const knownAgents = ["Ralph", "Scout", "Archivist", "Sentinel", "JHawk"];

    // Initialize all known agents as idle
    for (const agent of knownAgents) {
      agentStatus[agent] = {
        status: "idle",
        currentTask: null,
        lastActivity: 0,
        recentTasks: 0,
        recentFailed: 0,
      };
    }

    // Process recent tasks
    for (const task of recentTasks) {
      const agent = task.agentName ?? "Unknown";
      if (!agentStatus[agent]) {
        agentStatus[agent] = {
          status: "idle",
          currentTask: null,
          lastActivity: 0,
          recentTasks: 0,
          recentFailed: 0,
        };
      }

      agentStatus[agent].recentTasks++;
      if (task.updatedAt > agentStatus[agent].lastActivity) {
        agentStatus[agent].lastActivity = task.updatedAt;
      }

      if (task.status === "running") {
        agentStatus[agent].status = "active";
        agentStatus[agent].currentTask = task.title;
      } else if (task.status === "failed") {
        agentStatus[agent].recentFailed++;
        // Only mark as failed if no active task
        if (agentStatus[agent].status !== "active") {
          agentStatus[agent].status = "failed";
        }
      }
    }

    return agentStatus;
  },
});
