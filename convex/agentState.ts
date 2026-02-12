import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Update agent state (heartbeat / status change)
export const update = mutation({
  args: {
    agentId: v.string(),
    status: v.string(),
    currentTaskId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agent_state")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        currentTaskId: args.currentTaskId,
        lastHeartbeat: Date.now(),
        metadata: args.metadata,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("agent_state", {
        agentId: args.agentId,
        status: args.status,
        currentTaskId: args.currentTaskId,
        lastHeartbeat: Date.now(),
        metadata: args.metadata,
      });
    }
  },
});

// Get agent state
export const get = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_state")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

// Get all agent states
export const all = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agent_state").collect();
  },
});
