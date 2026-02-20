import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════
// MC Tasks (Kanban Board)
// ═══════════════════════════════════════════════════════

// List all tasks
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("mc_tasks")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();
  },
});

// List tasks by column (for Kanban)
export const listByColumn = query({
  args: {
    column: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mc_tasks")
      .withIndex("by_column", (q) => q.eq("column", args.column))
      .order("desc")
      .collect();
  },
});

// Get task by ID
export const getById = query({
  args: {
    id: v.id("mc_tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    column: v.string(),
    assigneeId: v.optional(v.string()),
    assigneeName: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("mc_tasks", {
      ...args,
      description: args.description || "",
      status: args.column,
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update task column (for drag-and-drop)
export const updateColumn = mutation({
  args: {
    id: v.id("mc_tasks"),
    column: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      column: args.column,
      status: args.column,
      updatedAt: Date.now(),
    });
  },
});

// Update task
export const update = mutation({
  args: {
    id: v.id("mc_tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    column: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    assigneeName: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete task
export const remove = mutation({
  args: {
    id: v.id("mc_tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
