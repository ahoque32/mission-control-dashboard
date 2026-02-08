import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_createdAt")
      .order("asc")
      .collect();
  },
});

export const listByTask = query({
  args: { taskId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    taskId: v.string(),
    fromAgentId: v.string(),
    content: v.string(),
    attachments: v.array(v.string()),
    mentions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
