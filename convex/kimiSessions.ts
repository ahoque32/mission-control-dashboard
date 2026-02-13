/**
 * Kimi Portal v2 — Session Management
 *
 * Provides isolated session tracking for JHawk and Kimi.
 * Sessions are strictly scoped by owner — no cross-session access for Kimi.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new Kimi session.
 * Only JHawk can spawn sessions (enforced at API layer).
 */
export const create = mutation({
  args: {
    sessionId: v.string(),
    owner: v.string(),
    mode: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!["jhawk", "kimi"].includes(args.owner)) {
      throw new Error(`Invalid session owner: ${args.owner}`);
    }
    if (!["operator", "advisor"].includes(args.mode)) {
      throw new Error(`Invalid session mode: ${args.mode}`);
    }

    return await ctx.db.insert("kimi_sessions", {
      sessionId: args.sessionId,
      owner: args.owner,
      status: "active",
      mode: args.mode,
      messageCount: 0,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get a session by sessionId.
 */
export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

/**
 * List sessions by owner and optional status filter.
 */
export const listByOwner = query({
  args: {
    owner: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 20;

    if (args.status) {
      return await ctx.db
        .query("kimi_sessions")
        .withIndex("by_owner_status", (q) =>
          q.eq("owner", args.owner).eq("status", args.status!)
        )
        .order("desc")
        .take(lim);
    }

    // Filter manually if no status specified
    const all = await ctx.db
      .query("kimi_sessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);
    return all.filter((s) => s.owner === args.owner).slice(0, lim);
  },
});

/**
 * List all active sessions.
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const jhawkSessions = await ctx.db
      .query("kimi_sessions")
      .withIndex("by_owner_status", (q) =>
        q.eq("owner", "jhawk").eq("status", "active")
      )
      .take(10);

    const kimiSessions = await ctx.db
      .query("kimi_sessions")
      .withIndex("by_owner_status", (q) =>
        q.eq("owner", "kimi").eq("status", "active")
      )
      .take(10);

    return [...jhawkSessions, ...kimiSessions];
  },
});

/**
 * Close a session.
 */
export const close = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("kimi_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) throw new Error(`Session ${args.sessionId} not found`);
    if (session.status === "closed") return session._id;

    await ctx.db.patch(session._id, {
      status: "closed",
      closedAt: Date.now(),
    });

    return session._id;
  },
});

/**
 * Increment message count for a session.
 */
export const incrementMessageCount = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("kimi_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) throw new Error(`Session ${args.sessionId} not found`);

    await ctx.db.patch(session._id, {
      messageCount: session.messageCount + 1,
    });
  },
});
