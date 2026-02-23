import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════
// Active Agent Squad (7 Agents)
// ═══════════════════════════════════════════════════════
export const ACTIVE_AGENTS = [
  {
    name: "Anton",
    role: "Commander",
    model: "claude-opus-4.6",
    provider: "anthropic",
    emoji: "🤖",
    level: "commander",
    capabilities: ["orchestration", "decision-making", "architecture"],
  },
  {
    name: "Echo",
    role: "Deputy (GPT)",
    model: "gpt-5.3-codex",
    provider: "openai",
    emoji: "🪞",
    level: "lead",
    capabilities: ["coding", "analysis", "research"],
  },
  {
    name: "Drago",
    role: "Deputy (Gemini)",
    model: "gemini-3-pro",
    provider: "google",
    emoji: "🐉",
    level: "lead",
    capabilities: ["coding", "multimodal", "research"],
  },
  {
    name: "Dante",
    role: "Developer",
    model: "kimi-k2.5",
    provider: "moonshot",
    emoji: "🔥",
    level: "specialist",
    capabilities: ["coding", "refactoring", "implementation"],
  },
  {
    name: "Vincent",
    role: "Utility",
    model: "minimax-m2.5",
    provider: "minimax",
    emoji: "🎨",
    level: "specialist",
    capabilities: ["design", "ui-ux", "content"],
  },
  {
    name: "Hunter",
    role: "Sales/Outbound",
    model: "minimax-m2.5",
    provider: "minimax",
    emoji: "🎯",
    level: "specialist",
    capabilities: ["sales", "outreach", "communication"],
  },
  {
    name: "Maestro",
    role: "Orchestrator",
    model: "kimi-k2.5",
    provider: "moonshot",
    emoji: "🎼",
    level: "lead",
    capabilities: ["orchestration", "workflow", "coordination"],
  },
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").withIndex("by_name").collect();
  },
});

export const getById = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

export const updateHeartbeat = mutation({
  args: {
    id: v.id("agents"),
    lastHeartbeat: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastHeartbeat: args.lastHeartbeat,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    model: v.string(),
    provider: v.string(),
    status: v.string(),
    emoji: v.string(),
    level: v.string(),
    lastHeartbeat: v.number(),
    telegramBot: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    currentTaskId: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agents", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const updateCurrentTask = mutation({
  args: {
    id: v.id("agents"),
    currentTaskId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      currentTaskId: args.currentTaskId,
      updatedAt: Date.now(),
    });
  },
});

// Seed the active agents if they don't exist
export const seedAgents = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results = [];

    for (const agent of ACTIVE_AGENTS) {
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_name")
        .filter((q) => q.eq(q.field("name"), agent.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("agents", {
          ...agent,
          status: "idle",
          lastHeartbeat: now,
          createdAt: now,
          updatedAt: now,
        });
        results.push({ name: agent.name, id, action: "created" });
      } else {
        results.push({ name: agent.name, id: existing._id, action: "exists" });
      }
    }

    return results;
  },
});
