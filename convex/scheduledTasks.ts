import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════
// Scheduled Tasks (Calendar View)
// ═══════════════════════════════════════════════════════

// List all scheduled tasks
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scheduled_tasks")
      .withIndex("by_nextRun")
      .order("asc")
      .collect();
  },
});

// List by agent
export const listByAgent = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduled_tasks")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

// Get by ID
export const getById = query({
  args: {
    id: v.id("scheduled_tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create scheduled task
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.string(),
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    category: v.optional(v.string()),
    nextRun: v.optional(v.number()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("scheduled_tasks", {
      ...args,
      description: args.description || "",
      category: args.category || "recurring",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update scheduled task
export const update = mutation({
  args: {
    id: v.id("scheduled_tasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    schedule: v.optional(v.string()),
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    category: v.optional(v.string()),
    nextRun: v.optional(v.number()),
    lastRun: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete scheduled task
export const remove = mutation({
  args: {
    id: v.id("scheduled_tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Record task execution
export const recordRun = mutation({
  args: {
    id: v.id("scheduled_tasks"),
    nextRun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, nextRun } = args;
    await ctx.db.patch(id, {
      lastRun: Date.now(),
      ...(nextRun && { nextRun }),
      updatedAt: Date.now(),
    });
  },
});
