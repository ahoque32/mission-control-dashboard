import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════
// Memory Browser
// ═══════════════════════════════════════════════════════

// List all memory entries
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("memory_entries")
      .withIndex("by_updatedAt")
      .order("desc")
      .take(100);
  },
});

// List by agent
export const listByAgent = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memory_entries")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(100);
  },
});

// List by entry type
export const listByType = query({
  args: {
    entryType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memory_entries")
      .withIndex("by_entryType", (q) => q.eq("entryType", args.entryType))
      .order("desc")
      .take(100);
  },
});

// Get by ID
export const getById = query({
  args: {
    id: v.id("memory_entries"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search memory entries
export const search = query({
  args: {
    query: v.string(),
    agentId: v.optional(v.string()),
    entryType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use search index if available, otherwise fallback to filter
    let results = await ctx.db
      .query("memory_entries")
      .withSearchIndex("search_content", (q) => q.search("content", args.query)
      )
      .take(50);

    // Apply filters
    if (args.agentId) {
      results = results.filter((r) => r.agentId === args.agentId);
    }
    if (args.entryType) {
      results = results.filter((r) => r.entryType === args.entryType);
    }

    return results;
  },
});

// Create memory entry (for sync from filesystem)
export const create = mutation({
  args: {
    agentId: v.string(),
    agentName: v.string(),
    filePath: v.string(),
    fileName: v.string(),
    content: v.string(),
    entryType: v.string(),
    date: v.optional(v.string()),
    searchIndex: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("memory_entries", {
      ...args,
      updatedAt: now,
    });
  },
});

// Update memory entry
export const update = mutation({
  args: {
    id: v.id("memory_entries"),
    content: v.string(),
    searchIndex: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete memory entry
export const remove = mutation({
  args: {
    id: v.id("memory_entries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Sync memory entries from filesystem (bulk operation)
export const syncFromFilesystem = mutation({
  args: {
    entries: v.array(
      v.object({
        agentId: v.string(),
        agentName: v.string(),
        filePath: v.string(),
        fileName: v.string(),
        content: v.string(),
        entryType: v.string(),
        date: v.optional(v.string()),
        searchIndex: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const entry of args.entries) {
      // Check if entry already exists by filePath
      const existing = await ctx.db
        .query("memory_entries")
        .filter((q) => q.eq(q.field("filePath"), entry.filePath))
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          content: entry.content,
          searchIndex: entry.searchIndex,
          updatedAt: Date.now(),
        });
        results.push({ id: existing._id, action: "updated" });
      } else {
        // Create new
        const id = await ctx.db.insert("memory_entries", {
          ...entry,
          updatedAt: Date.now(),
        });
        results.push({ id, action: "created" });
      }
    }
    return results;
  },
});
