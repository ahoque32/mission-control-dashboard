/**
 * Kimi Portal v2 — Delegation Management
 *
 * Tracks task delegations from Kimi to worker agents.
 * Model overrides are always scoped to the individual task.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const VALID_AGENTS = ["ralph", "scout", "archivist", "sentinel"];
const VALID_CALLERS = ["jhawk", "kimi"];
const VALID_STATUSES = ["pending", "claimed", "in_progress", "completed", "failed"];

/**
 * Create a new delegation.
 * Validates caller permissions and enforces task-scoped model overrides.
 */
export const create = mutation({
  args: {
    delegationId: v.string(),
    sessionId: v.string(),
    callerAgent: v.string(),
    targetAgent: v.string(),
    taskDescription: v.string(),
    modelOverride: v.string(),
    modelOverrideScope: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate caller
    if (!VALID_CALLERS.includes(args.callerAgent)) {
      throw new Error(`DENIED: ${args.callerAgent} cannot create delegations`);
    }

    // Validate target
    if (!VALID_AGENTS.includes(args.targetAgent)) {
      throw new Error(`Invalid target agent: ${args.targetAgent}`);
    }

    // Prevent self-delegation
    if (args.callerAgent === args.targetAgent) {
      throw new Error("Cannot delegate to self");
    }

    // Enforce task-scoped model overrides ONLY
    if (args.modelOverrideScope !== "task") {
      throw new Error(
        `DENIED: modelOverrideScope must be "task", got "${args.modelOverrideScope}". Permanent model changes are not allowed.`
      );
    }

    return await ctx.db.insert("kimi_delegations", {
      delegationId: args.delegationId,
      sessionId: args.sessionId,
      callerAgent: args.callerAgent,
      targetAgent: args.targetAgent,
      taskDescription: args.taskDescription,
      modelOverride: args.modelOverride,
      modelOverrideScope: "task", // Hardcoded — never trust client
      context: args.context,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/**
 * Get a delegation by delegationId.
 */
export const getById = query({
  args: { delegationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_delegations")
      .withIndex("by_delegationId", (q) =>
        q.eq("delegationId", args.delegationId)
      )
      .first();
  },
});

/**
 * List delegations for a session.
 */
export const listBySession = query({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 50;
    return await ctx.db
      .query("kimi_delegations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(lim);
  },
});

/**
 * List pending delegations for a target agent.
 */
export const listPendingByAgent = query({
  args: { targetAgent: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_delegations")
      .withIndex("by_targetAgent_status", (q) =>
        q.eq("targetAgent", args.targetAgent).eq("status", "pending")
      )
      .collect();
  },
});

/**
 * List recent delegations.
 */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 30;
    return await ctx.db
      .query("kimi_delegations")
      .withIndex("by_createdAt")
      .order("desc")
      .take(lim);
  },
});

/**
 * Claim a delegation (worker picks it up).
 */
export const claim = mutation({
  args: { delegationId: v.string() },
  handler: async (ctx, args) => {
    const delegation = await ctx.db
      .query("kimi_delegations")
      .withIndex("by_delegationId", (q) =>
        q.eq("delegationId", args.delegationId)
      )
      .first();

    if (!delegation) throw new Error(`Delegation ${args.delegationId} not found`);
    if (delegation.status !== "pending") {
      throw new Error(
        `Delegation ${args.delegationId} is ${delegation.status}, not pending`
      );
    }

    await ctx.db.patch(delegation._id, {
      status: "in_progress",
      claimedAt: Date.now(),
    });

    return delegation;
  },
});

/**
 * Complete a delegation with result.
 */
export const complete = mutation({
  args: {
    delegationId: v.string(),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const delegation = await ctx.db
      .query("kimi_delegations")
      .withIndex("by_delegationId", (q) =>
        q.eq("delegationId", args.delegationId)
      )
      .first();

    if (!delegation) throw new Error(`Delegation ${args.delegationId} not found`);

    await ctx.db.patch(delegation._id, {
      status: "completed",
      result: args.result,
      completedAt: Date.now(),
    });

    return delegation;
  },
});

/**
 * Fail a delegation with error.
 */
export const fail = mutation({
  args: {
    delegationId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const delegation = await ctx.db
      .query("kimi_delegations")
      .withIndex("by_delegationId", (q) =>
        q.eq("delegationId", args.delegationId)
      )
      .first();

    if (!delegation) throw new Error(`Delegation ${args.delegationId} not found`);

    await ctx.db.patch(delegation._id, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });

    return delegation;
  },
});
