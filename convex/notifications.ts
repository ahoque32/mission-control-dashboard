import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ═══════════════════════════════════════════════════════
// Notifications Queries
// ═══════════════════════════════════════════════════════

export const list = query({
  args: {
    recipientId: v.optional(v.string()),
    read: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("notifications");
    
    if (args.recipientId !== undefined && args.read !== undefined) {
      q = q.withIndex("by_recipientId_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("read", args.read)
      );
    } else if (args.recipientId !== undefined) {
      q = q.withIndex("by_recipientId_read", (q) =>
        q.eq("recipientId", args.recipientId)
      );
    }
    
    let results = await q.order("desc").collect();
    
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    
    return results;
  },
});

export const getById = query({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUnreadCount = query({
  args: { recipientId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipientId_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("read", false)
      )
      .collect();
    return notifications.length;
  },
});

// ═══════════════════════════════════════════════════════
// Notifications Mutations
// ═══════════════════════════════════════════════════════

export const create = mutation({
  args: {
    recipientId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.optional(v.boolean()),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: args.read ?? false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notifications"),
    read: v.optional(v.boolean()),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: { recipientId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipientId_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("read", false)
      )
      .collect();
    
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, { read: true });
    }
    
    return notifications.length;
  },
});

export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
