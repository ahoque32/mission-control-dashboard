import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ═══════════════════════════════════════════════════════
// Call Logs Queries
// ═══════════════════════════════════════════════════════

export const list = query({
  args: {
    agentId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("call_logs_convex");
    
    if (args.agentId) {
      q = q.withIndex("by_agentId", (q) => q.eq("agentId", args.agentId));
    }
    
    let results = await q.order("desc").collect();
    
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    
    return results;
  },
});

export const getById = query({
  args: { id: v.id("call_logs_convex") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("call_logs_convex")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

// ═══════════════════════════════════════════════════════
// Call Logs Mutations
// ═══════════════════════════════════════════════════════

export const create = mutation({
  args: {
    agentId: v.string(),
    contactName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    direction: v.string(),
    duration: v.number(),
    status: v.string(),
    transcript: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("call_logs_convex", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("call_logs_convex"),
    contactName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    direction: v.optional(v.string()),
    duration: v.optional(v.number()),
    status: v.optional(v.string()),
    transcript: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const updateTranscript = mutation({
  args: {
    id: v.id("call_logs_convex"),
    transcript: v.string(),
    sentiment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("call_logs_convex") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
