import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cron_jobs")
      .withIndex("by_name")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    schedule: v.string(),
    cronExpression: v.string(),
    category: v.string(),
    enabled: v.boolean(),
    description: v.optional(v.string()),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cron_jobs", args);
  },
});
