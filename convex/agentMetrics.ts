import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ═══════════════════════════════════════════════════════
// Agent Metrics Queries
// ═══════════════════════════════════════════════════════

export const list = query({
  args: {
    agentId: v.optional(v.string()),
    date: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("agent_metrics");
    
    if (args.agentId && args.date) {
      q = q.withIndex("by_agentId_date", (q) => 
        q.eq("agentId", args.agentId).eq("date", args.date)
      );
    } else if (args.agentId) {
      q = q.withIndex("by_agentId_date", (q) => 
        q.eq("agentId", args.agentId)
      );
    } else if (args.date) {
      q = q.withIndex("by_date", (q) => q.eq("date", args.date));
    }
    
    let results = await q.order("desc").collect();
    
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    
    return results;
  },
});

export const getById = query({
  args: { id: v.id("agent_metrics") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ═══════════════════════════════════════════════════════
// Agent Metrics Mutations
// ═══════════════════════════════════════════════════════

export const create = mutation({
  args: {
    agentId: v.string(),
    date: v.string(),
    tasksCompleted: v.number(),
    tasksFailed: v.number(),
    avgResponseTimeMs: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    uptimeMinutes: v.number(),
    errors: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agent_metrics", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("agent_metrics"),
    tasksCompleted: v.optional(v.number()),
    tasksFailed: v.optional(v.number()),
    avgResponseTimeMs: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    uptimeMinutes: v.optional(v.number()),
    errors: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const incrementTasksCompleted = mutation({
  args: {
    agentId: v.string(),
    date: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agent_metrics")
      .withIndex("by_agentId_date", (q) =>
        q.eq("agentId", args.agentId).eq("date", args.date)
      )
      .first();
    
    const increment = args.amount ?? 1;
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        tasksCompleted: (existing.tasksCompleted || 0) + increment,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("agent_metrics", {
        agentId: args.agentId,
        date: args.date,
        tasksCompleted: increment,
        tasksFailed: 0,
        uptimeMinutes: 0,
      });
    }
  },
});
