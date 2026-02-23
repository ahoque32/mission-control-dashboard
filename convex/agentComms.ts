import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Agent Communications Module
 * Tracks all agent-to-agent communications across channels.
 */

// Log a communication event
export const log = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    channel: v.string(), // 'convex' | 'telegram' | 'spawn' | 'session'
    message: v.string(),
    metadata: v.optional(v.any()), // commit hash, file paths, payload summary
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ts = args.createdAt ?? Date.now();

    return await ctx.db.insert("agent_comms", {
      from: args.from,
      to: args.to,
      channel: args.channel,
      message: args.message,
      metadata: args.metadata ?? null,
      createdAt: ts,
    });
  },
});

// List communications with optional filters
export const list = query({
  args: {
    limit: v.optional(v.number()),
    channel: v.optional(v.string()),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 100;

    // Fetch recent comms, then filter client-side for simplicity
    const results = await ctx.db
      .query("agent_comms")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim * 3);

    let filtered = results;
    if (args.channel) {
      filtered = filtered.filter((r) => r.channel === args.channel);
    }
    if (args.from) {
      filtered = filtered.filter((r) => r.from === args.from);
    }
    if (args.to) {
      filtered = filtered.filter((r) => r.to === args.to);
    }
    if (args.startTime !== undefined) {
      filtered = filtered.filter((r) => r.createdAt >= args.startTime!);
    }
    if (args.endTime !== undefined) {
      filtered = filtered.filter((r) => r.createdAt <= args.endTime!);
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
      .withIndex("by_createdAt")
      .order("desc")
      .take(1000);

    const byChannel: Record<string, number> = {};
    const byFrom: Record<string, number> = {};
    const byTo: Record<string, number> = {};

    all.forEach((c) => {
      byChannel[c.channel] = (byChannel[c.channel] || 0) + 1;
      byFrom[c.from] = (byFrom[c.from] || 0) + 1;
      byTo[c.to] = (byTo[c.to] || 0) + 1;
    });

    return {
      total: all.length,
      byChannel,
      byFrom,
      byTo,
      latest: all[0] ?? null,
    };
  },
});
