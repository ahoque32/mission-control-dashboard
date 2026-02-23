import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ═══════════════════════════════════════════════════════
// Outbound Prospects Queries
// ═══════════════════════════════════════════════════════

export const list = query({
  args: {
    stage: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    
    if (args.stage) {
      results = await ctx.db.query("outbound_prospects")
        .withIndex("by_stage", (q) => q.eq("stage", args.stage!))
        .order("desc").collect();
    } else if (args.assignedTo) {
      results = await ctx.db.query("outbound_prospects")
        .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.assignedTo!))
        .order("desc").collect();
    } else {
      results = await ctx.db.query("outbound_prospects")
        .order("desc").collect();
    }
    
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    
    return results;
  },
});

export const getById = query({
  args: { id: v.id("outbound_prospects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByStage = query({
  args: { stage: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outbound_prospects")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .order("desc")
      .collect();
  },
});

export const getFollowUpsDue = query({
  args: { before: v.number() },
  handler: async (ctx, args) => {
    const prospects = await ctx.db.query("outbound_prospects").collect();
    return prospects.filter(p => p.nextFollowUpAt && p.nextFollowUpAt <= args.before);
  },
});

// ═══════════════════════════════════════════════════════
// Outbound Prospects Mutations
// ═══════════════════════════════════════════════════════

export const create = mutation({
  args: {
    companyName: v.string(),
    contactName: v.string(),
    contactEmail: v.string(),
    stage: v.string(),
    source: v.string(),
    assignedTo: v.string(),
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("outbound_prospects", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("outbound_prospects"),
    companyName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    stage: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    nextFollowUpAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("outbound_prospects"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      stage: args.stage,
      updatedAt: Date.now(),
    });
  },
});

export const recordContact = mutation({
  args: {
    id: v.id("outbound_prospects"),
    nextFollowUpAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    return await ctx.db.patch(id, {
      ...rest,
      lastContactedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("outbound_prospects") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
