import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const upsertByTitle = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.string(),
    taskId: v.union(v.string(), v.null()),
    createdBy: v.string(),
    filePath: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find existing document by title
    const existing = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        type: args.type,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("documents", {
        title: args.title,
        content: args.content,
        type: args.type,
        taskId: args.taskId,
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.string(),
    taskId: v.union(v.string(), v.null()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("documents", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
