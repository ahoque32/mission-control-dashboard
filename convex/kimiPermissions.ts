/**
 * Kimi Portal v2 — Permission Enforcement & Audit
 *
 * Logs all permission checks. Provides query functions for audit review.
 * Actual permission logic is in lib/kimi/kimi.permissions.ts — this is the persistence layer.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log a permission check (allow or deny).
 */
export const log = mutation({
  args: {
    callerAgent: v.string(),
    action: v.string(),
    resource: v.string(),
    allowed: v.boolean(),
    reason: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("kimi_permissions_log", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * List recent permission denials (for JHawk audit review).
 */
export const listDenied = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 50;
    const all = await ctx.db
      .query("kimi_permissions_log")
      .withIndex("by_allowed", (q) => q.eq("allowed", false))
      .order("desc")
      .take(lim);
    return all;
  },
});

/**
 * List recent permission checks by agent.
 */
export const listByAgent = query({
  args: {
    callerAgent: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 50;
    return await ctx.db
      .query("kimi_permissions_log")
      .withIndex("by_callerAgent", (q) =>
        q.eq("callerAgent", args.callerAgent)
      )
      .order("desc")
      .take(lim);
  },
});

/**
 * List recent permission checks (all).
 */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 100;
    return await ctx.db
      .query("kimi_permissions_log")
      .withIndex("by_timestamp")
      .order("desc")
      .take(lim);
  },
});
