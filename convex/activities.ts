import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim);
  },
});

export const listByAgent = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 10;
    const all = await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(500);
    return all.filter((a) => a.agentId === args.agentId).slice(0, lim);
  },
});

export const create = mutation({
  args: {
    type: v.string(),
    agentId: v.string(),
    taskId: v.union(v.string(), v.null()),
    message: v.string(),
    metadata: v.any(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: args.createdAt ?? Date.now(),
    });
  },
});
