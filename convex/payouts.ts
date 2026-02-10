import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 20;
    return await ctx.db
      .query("payouts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim);
  },
});

export const create = mutation({
  args: {
    recipient: v.string(),
    email: v.string(),
    amount: v.number(),
    status: v.string(),
    paypalBatchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payouts", {
      recipient: args.recipient,
      email: args.email,
      amount: args.amount,
      status: args.status,
      paypalBatchId: args.paypalBatchId,
      createdAt: Date.now(),
    });
  },
});
