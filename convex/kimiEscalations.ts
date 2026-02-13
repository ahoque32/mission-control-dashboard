import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("kimi_escalations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(50);
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 20;
    return await ctx.db
      .query("kimi_escalations")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim);
  },
});

export const getById = query({
  args: { id: v.id("kimi_escalations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    conversationId: v.string(),
    trigger: v.string(),
    severity: v.string(),
    summary: v.string(),
    context: v.any(),
    actions: v.any(),
    risks: v.array(v.string()),
    nextSteps: v.array(v.string()),
    kimiMemorySnapshot: v.any(),
    userNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kimi_escalations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const resolve = mutation({
  args: {
    id: v.id("kimi_escalations"),
    resolvedBy: v.string(),
    resolution: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      resolvedBy: args.resolvedBy,
      resolvedAt: Date.now(),
      resolution: args.resolution,
    });
  },
});
