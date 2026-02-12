import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    status: v.string(),
    currentTaskId: v.union(v.string(), v.null()),
    sessionKey: v.string(),
    emoji: v.string(),
    level: v.string(),
    lastHeartbeat: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.string(),
    priority: v.string(),
    assigneeIds: v.array(v.string()),
    createdBy: v.string(),
    dueDate: v.union(v.number(), v.null()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Spawn tracking fields (optional for manual tasks)
    isSpawnTask: v.optional(v.boolean()),
    sessionKey: v.optional(v.string()),
    agentName: v.optional(v.string()),
    spawnedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    result: v.optional(v.string()),
  })
    .index("by_updatedAt", ["updatedAt"])
    .index("by_sessionKey", ["sessionKey"])
    .index("by_status", ["status"]),

  activities: defineTable({
    type: v.string(),
    agentId: v.string(),
    taskId: v.union(v.string(), v.null()),
    message: v.string(),
    metadata: v.any(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  messages: defineTable({
    taskId: v.string(),
    fromAgentId: v.string(),
    content: v.string(),
    attachments: v.array(v.string()),
    mentions: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_createdAt", ["createdAt"]),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.string(),
    taskId: v.union(v.string(), v.null()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_updatedAt", ["updatedAt"]),

  payouts: defineTable({
    recipient: v.string(),
    email: v.string(),
    amount: v.number(),
    status: v.string(),
    paypalBatchId: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  // Agent-to-Agent Coordination (JHawk <-> Anton)
  agent_tasks: defineTable({
    taskId: v.string(),
    type: v.string(), // "heavy-compute" | "large-context" | "batch" | "analysis" | "research"
    status: v.string(), // "pending" | "claimed" | "in_progress" | "completed" | "failed"
    priority: v.string(), // "low" | "normal" | "high" | "urgent"
    assignedTo: v.string(), // "jhawk" | "anton"
    delegatedBy: v.string(), // "jhawk" | "anton"
    prompt: v.string(),
    context: v.optional(v.string()),
    files: v.optional(v.array(v.string())),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
    timeoutMs: v.optional(v.number()),
    createdAt: v.number(),
    claimedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_assignedTo_status", ["assignedTo", "status"])
    .index("by_taskId", ["taskId"])
    .index("by_createdAt", ["createdAt"]),

  agent_state: defineTable({
    agentId: v.string(), // "jhawk" | "anton"
    status: v.string(), // "online" | "busy" | "offline"
    currentTaskId: v.optional(v.string()),
    lastHeartbeat: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_agentId", ["agentId"]),

  // Agent-to-Agent direct messages (bidirectional, rate-limited)
  agent_messages: defineTable({
    from: v.string(), // "jhawk" | "anton"
    to: v.string(), // "jhawk" | "anton"
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_to_read", ["to", "read"])
    .index("by_createdAt", ["createdAt"])
    .index("by_from_createdAt", ["from", "createdAt"]),

  // Rate limit tracking
  agent_rate_limits: defineTable({
    agentId: v.string(),
    windowStart: v.number(), // start of 5-min window
    count: v.number(), // messages sent in this window
  }).index("by_agentId", ["agentId"]),

  // Agent Communications Log (JHawk <-> Anton)
  agent_comms: defineTable({
    from: v.string(),            // "jhawk" | "anton" | "ralph" | etc.
    to: v.string(),              // "jhawk" | "anton" | "ralph" | etc.
    channel: v.string(),         // "convex_msg" | "webhook" | "git_push" | "brain_prime_sync"
    message: v.string(),
    metadata: v.optional(v.any()), // commit hash, file paths, payload summary, etc.
    timestamp: v.number(),
    direction: v.string(),       // "jhawk_to_anton" | "anton_to_jhawk"
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_channel", ["channel"])
    .index("by_direction", ["direction"])
    .index("by_channel_timestamp", ["channel", "timestamp"]),

  cron_jobs: defineTable({
    name: v.string(),
    schedule: v.string(),
    cronExpression: v.string(),
    category: v.string(),
    enabled: v.boolean(),
    description: v.optional(v.string()),
    lastRun: v.optional(v.number()),
    nextRun: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
});
