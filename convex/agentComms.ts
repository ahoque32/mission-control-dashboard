import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Agent Communications Module
 * Tracks all JHawk↔Anton agent communications across channels.
 */

// Log a communication event
export const log = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    channel: v.string(), // 'convex_msg' | 'webhook' | 'git_push' | 'brain_prime_sync'
    message: v.string(),
    metadata: v.optional(v.any()), // commit hash, file paths, webhook payload summary
    direction: v.optional(v.string()), // 'jhawk_to_anton' | 'anton_to_jhawk' — auto-derived if omitted
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ts = args.timestamp ?? Date.now();
    const direction =
      args.direction ?? `${args.from.toLowerCase()}_to_${args.to.toLowerCase()}`;

    return await ctx.db.insert("agent_comms", {
      from: args.from,
      to: args.to,
      channel: args.channel,
      message: args.message,
      metadata: args.metadata ?? null,
      direction,
      timestamp: ts,
    });
  },
});

// List communications with optional filters
export const list = query({
  args: {
    limit: v.optional(v.number()),
    channel: v.optional(v.string()),
    direction: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 100;

    let results;
    if (args.channel) {
      results = await ctx.db
        .query("agent_comms")
        .withIndex("by_channel_timestamp", (q) => {
          let query = q.eq("channel", args.channel!);
          if (args.startTime !== undefined) {
            query = query.gte("timestamp", args.startTime);
          }
          if (args.endTime !== undefined) {
            query = query.lte("timestamp", args.endTime);
          }
          return query;
        })
        .order("desc")
        .take(lim);
    } else {
      results = await ctx.db
        .query("agent_comms")
        .withIndex("by_timestamp")
        .order("desc")
        .take(lim * 2);
    }

    // Apply remaining filters
    let filtered = results;
    if (args.direction) {
      filtered = filtered.filter((r) => r.direction === args.direction);
    }
    if (!args.channel && args.startTime !== undefined) {
      filtered = filtered.filter((r) => r.timestamp >= args.startTime!);
    }
    if (!args.channel && args.endTime !== undefined) {
      filtered = filtered.filter((r) => r.timestamp <= args.endTime!);
    }

    return filtered.slice(0, lim);
  },
});

// Get a single communication entry by ID
export const get = query({
  args: {
    id: v.id("agent_comms"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
