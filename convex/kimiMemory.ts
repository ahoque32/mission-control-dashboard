import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("kimi_memory")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(50);
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_memory")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_memory")
      .withIndex("by_category_status", (q) =>
        q.eq("category", args.category).eq("status", "active")
      )
      .order("desc")
      .take(50);
  },
});

export const upsert = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kimi_memory")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        category: args.category,
        status: "active",
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("kimi_memory", {
      key: args.key,
      value: args.value,
      category: args.category,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const archive = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("kimi_memory")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (entry) {
      await ctx.db.patch(entry._id, {
        status: "archived",
        updatedAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("kimi_memory")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (entry) {
      await ctx.db.delete(entry._id);
    }
  },
});
