import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("memory_sync_proposals")
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
      .query("memory_sync_proposals")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim);
  },
});

export const create = mutation({
  args: {
    proposedBy: v.string(),
    type: v.string(),
    targetSection: v.string(),
    description: v.string(),
    currentState: v.string(),
    proposedState: v.string(),
    evidence: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memory_sync_proposals", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const review = mutation({
  args: {
    id: v.id("memory_sync_proposals"),
    status: v.string(),
    jhawkResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      jhawkResponse: args.jhawkResponse,
    });
  },
});
