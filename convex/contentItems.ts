import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════
// Content Pipeline
// ═══════════════════════════════════════════════════════

// List all content items
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("content_items")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();
  },
});

// List by stage
export const listByStage = query({
  args: {
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content_items")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .order("desc")
      .collect();
  },
});

// List by agent
export const listByAgent = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("content_items")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();
  },
});

// Get by ID
export const getById = query({
  args: {
    id: v.id("content_items"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create content item
export const create = mutation({
  args: {
    title: v.string(),
    stage: v.string(),
    description: v.optional(v.string()),
    script: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("content_items", {
      ...args,
      description: args.description || "",
      script: args.script || "",
      thumbnail: args.thumbnail || "",
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update content item
export const update = mutation({
  args: {
    id: v.id("content_items"),
    title: v.optional(v.string()),
    stage: v.optional(v.string()),
    description: v.optional(v.string()),
    script: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Move content to next stage
export const moveStage = mutation({
  args: {
    id: v.id("content_items"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      stage: args.stage,
      updatedAt: Date.now(),
    });
  },
});

// Delete content item
export const remove = mutation({
  args: {
    id: v.id("content_items"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
