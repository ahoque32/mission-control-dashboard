import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create a new task (delegator creates it)
export const create = mutation({
  args: {
    taskId: v.string(),
    type: v.string(),
    priority: v.string(),
    assignedTo: v.string(),
    delegatedBy: v.string(),
    prompt: v.string(),
    context: v.optional(v.string()),
    files: v.optional(v.array(v.string())),
    timeoutMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("agent_tasks", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return id;
  },
});

// Internal mutation for creating tasks (called by action)
export const _create = internalMutation({
  args: {
    taskId: v.string(),
    type: v.string(),
    priority: v.string(),
    assignedTo: v.string(),
    delegatedBy: v.string(),
    prompt: v.string(),
    context: v.optional(v.string()),
    files: v.optional(v.array(v.string())),
    timeoutMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agent_tasks", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Create task AND notify the assigned agent via webhook
export const createAndNotify = action({
  args: {
    taskId: v.string(),
    type: v.string(),
    priority: v.string(),
    assignedTo: v.string(),
    delegatedBy: v.string(),
    prompt: v.string(),
    context: v.optional(v.string()),
    files: v.optional(v.array(v.string())),
    timeoutMs: v.optional(v.number()),
    webhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { webhookUrl, ...taskArgs } = args;

    // Create the task
    const id = await ctx.runMutation(internal.agentTasks._create, taskArgs);

    // Notify via webhook if URL provided — fire with short timeout
    const url = webhookUrl || process.env.ANTON_WEBHOOK_URL;
    if (url) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3s max
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "task_created",
            taskId: args.taskId,
            type: args.type,
            priority: args.priority,
            assignedTo: args.assignedTo,
            delegatedBy: args.delegatedBy,
            prompt: args.prompt,
          }),
          signal: controller.signal,
        });
      } catch (e) {
        // Timeout or network error — task is already created, webhook is best-effort
        console.error("Webhook notification failed (non-blocking):", e);
      } finally {
        clearTimeout(timeout);
      }
    }

    return id;
  },
});

// Get pending tasks for an agent
export const pending = query({
  args: {
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_tasks")
      .withIndex("by_assignedTo_status", (q) =>
        q.eq("assignedTo", args.assignedTo).eq("status", "pending")
      )
      .collect();
  },
});

// Get in-progress tasks for an agent
export const inProgress = query({
  args: {
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_tasks")
      .withIndex("by_assignedTo_status", (q) =>
        q.eq("assignedTo", args.assignedTo).eq("status", "in_progress")
      )
      .collect();
  },
});

// Claim a task (worker picks it up)
export const claim = mutation({
  args: {
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("agent_tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) throw new Error(`Task ${args.taskId} not found`);
    if (task.status !== "pending") throw new Error(`Task ${args.taskId} is ${task.status}, not pending`);
    await ctx.db.patch(task._id, {
      status: "in_progress",
      claimedAt: Date.now(),
    });
    return task;
  },
});

// Complete a task with result
export const complete = mutation({
  args: {
    taskId: v.string(),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("agent_tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) throw new Error(`Task ${args.taskId} not found`);
    await ctx.db.patch(task._id, {
      status: "completed",
      result: args.result,
      completedAt: Date.now(),
    });
    return task;
  },
});

// Fail a task with error
export const fail = mutation({
  args: {
    taskId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("agent_tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
    if (!task) throw new Error(`Task ${args.taskId} not found`);
    await ctx.db.patch(task._id, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });
    return task;
  },
});

// Get a task by taskId
export const get = query({
  args: {
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();
  },
});

// List recent tasks (last 50)
export const recent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agent_tasks")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
  },
});
