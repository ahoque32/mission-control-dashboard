import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("config_update_requests")
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
      .query("config_update_requests")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim);
  },
});

export const create = mutation({
  args: {
    requestedBy: v.string(),
    targetProfile: v.string(),
    targetPath: v.string(),
    currentValue: v.any(),
    proposedValue: v.any(),
    rationale: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("config_update_requests", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const review = mutation({
  args: {
    id: v.id("config_update_requests"),
    status: v.string(),
    reviewedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
    });
  },
});
