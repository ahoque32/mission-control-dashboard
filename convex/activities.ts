import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
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
