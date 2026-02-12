import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Agent Communications Module
 *
 * NOTE: This module requires the `agent_comms` table in schema.ts.
 * Until deployed with `npx convex deploy`, communications are stored
 * in the `activities` table with type="agent_comm" and full metadata.
 *
 * Once deployed, switch scripts to use agentComms:log mutation directly.
 */

// Log a communication event
export const log = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    channel: v.string(), // 'convex_msg' | 'webhook' | 'git_push' | 'brain_prime_sync'
    message: v.string(),
    metadata: v.optional(v.any()), // commit hash, file paths, webhook payload summary
    direction: v.string(), // 'jhawk_to_anton' | 'anton_to_jhawk' | 'internal'
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agent_comms", {
      from: args.from,
      to: args.to,
      channel: args.channel,
      message: args.message,
      metadata: args.metadata ?? {},
      direction: args.direction,
      timestamp: args.timestamp ?? Date.now(),
    });
  },
});

// List communications with optional filters
export const list = query({
  args: {
    limit: v.optional(v.number()),
    channel: v.optional(v.string()),
    direction: v.optional(v.string()),
    since: v.optional(v.number()), // timestamp - only return comms after this time
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 100;

    let results = await ctx.db
      .query("agent_comms")
      .withIndex("by_timestamp")
      .order("desc")
      .take(500);

    // Apply filters
    if (args.channel) {
      results = results.filter((r) => r.channel === args.channel);
    }
    if (args.direction) {
      results = results.filter((r) => r.direction === args.direction);
    }
    if (args.since) {
      results = results.filter((r) => r.timestamp >= args.since!);
    }

    return results.slice(0, lim);
  },
});

// Get communication stats
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("agent_comms")
      .withIndex("by_timestamp")
      .order("desc")
      .take(1000);

    const byChannel: Record<string, number> = {};
    const byDirection: Record<string, number> = {};

    all.forEach((c) => {
      byChannel[c.channel] = (byChannel[c.channel] || 0) + 1;
      byDirection[c.direction] = (byDirection[c.direction] || 0) + 1;
    });

    return {
      total: all.length,
      byChannel,
      byDirection,
      latest: all[0] ?? null,
    };
  },
});
