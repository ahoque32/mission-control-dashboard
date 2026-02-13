import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_logs")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(100);
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 50;
    return await ctx.db
      .query("kimi_logs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(lim);
  },
});

export const create = mutation({
  args: {
    sessionId: v.string(),
    level: v.string(),
    category: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kimi_logs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const batchCreate = mutation({
  args: {
    logs: v.array(
      v.object({
        sessionId: v.string(),
        level: v.string(),
        category: v.string(),
        message: v.string(),
        metadata: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];
    for (const log of args.logs) {
      const id = await ctx.db.insert("kimi_logs", {
        ...log,
        timestamp: now,
      });
      ids.push(id);
    }
    return ids;
  },
});
