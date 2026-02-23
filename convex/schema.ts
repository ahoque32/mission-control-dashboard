import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ═══════════════════════════════════════════════════════
  // Core Agent Registry (Consolidated - 6 Active Agents)
  // ═══════════════════════════════════════════════════════
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    model: v.string(),           // Model ID (e.g., "claude-opus-4.6")
    provider: v.string(),        // Provider name (e.g., "anthropic", "openai")
    status: v.string(),          // "active" | "idle" | "offline" | "error"
    emoji: v.string(),
    level: v.string(),           // "intern" | "specialist" | "lead" | "commander"
    lastHeartbeat: v.number(),
    telegramBot: v.optional(v.string()),  // Bot username if applicable
    capabilities: v.optional(v.array(v.string())), // e.g., ["coding", "research", "design"]
    currentTaskId: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"])
    .index("by_status", ["status"]),

  // ═══════════════════════════════════════════════════════
  // Task Management
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // Activity Feed
  // ═══════════════════════════════════════════════════════
  activities: defineTable({
    type: v.string(),
    agentId: v.string(),
    taskId: v.union(v.string(), v.null()),
    message: v.string(),
    metadata: v.any(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"])
    .index("by_agentId", ["agentId"]),

  // ═══════════════════════════════════════════════════════
  // Agent-to-Agent Messaging
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // Documents
  // ═══════════════════════════════════════════════════════
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.string(),
    taskId: v.union(v.string(), v.null()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_updatedAt", ["updatedAt"]),

  // ═══════════════════════════════════════════════════════
  // Finance - Payouts
  // ═══════════════════════════════════════════════════════
  payouts: defineTable({
    recipient: v.string(),
    email: v.string(),
    amount: v.number(),
    status: v.string(),
    paypalBatchId: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  // ═══════════════════════════════════════════════════════
  // Agent-to-Agent Coordination (Generic - any agent ID)
  // ═══════════════════════════════════════════════════════
  agent_tasks: defineTable({
    taskId: v.string(),
    type: v.string(), // "heavy-compute" | "large-context" | "batch" | "analysis" | "research"
    status: v.string(), // "pending" | "claimed" | "in_progress" | "completed" | "failed"
    priority: v.string(), // "low" | "normal" | "high" | "urgent"
    assignedTo: v.string(), // Any agent ID
    delegatedBy: v.string(), // Any agent ID
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
    agentId: v.string(), // Any agent ID
    status: v.string(), // "online" | "busy" | "offline"
    currentTaskId: v.optional(v.string()),
    lastHeartbeat: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_agentId", ["agentId"]),

  // Agent-to-Agent direct messages (bidirectional, rate-limited)
  agent_messages: defineTable({
    from: v.string(), // Any agent ID
    to: v.string(),   // Any agent ID
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

  // Agent Communications Log (Generic)
  agent_comms: defineTable({
    from: v.string(),            // Any agent ID
    to: v.string(),              // Any agent ID
    channel: v.string(),         // "convex" | "telegram" | "spawn" | "session"
    message: v.string(),
    metadata: v.optional(v.any()), // commit hash, file paths, payload summary, etc.
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_channel", ["channel"])
    .index("by_from_to", ["from", "to"]),

  // ═══════════════════════════════════════════════════════
  // Cron Jobs
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // MC Dashboard V2 Tables
  // ═══════════════════════════════════════════════════════

  // Enhanced agent_tasks for Kanban board
  mc_tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.string(), // "backlog" | "in_progress" | "review" | "done"
    priority: v.string(), // "low" | "medium" | "high" | "urgent"
    column: v.string(), // Kanban column: "backlog" | "in_progress" | "review" | "done"
    assigneeId: v.optional(v.string()), // Agent ID
    assigneeName: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.array(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_column", ["column"])
    .index("by_assigneeId", ["assigneeId"])
    .index("by_updatedAt", ["updatedAt"]),

  // Scheduled tasks for Calendar view
  scheduled_tasks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    schedule: v.string(), // Cron expression or human-readable schedule
    agentId: v.optional(v.string()), // Assigned agent
    agentName: v.optional(v.string()),
    category: v.optional(v.string()), // "cron" | "one-time" | "recurring"
    nextRun: v.optional(v.number()),
    lastRun: v.optional(v.number()),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_nextRun", ["nextRun"])
    .index("by_enabled", ["enabled"]),

  // Content Pipeline items
  content_items: defineTable({
    title: v.string(),
    stage: v.string(), // "idea" | "script" | "thumbnail" | "filming" | "editing" | "published"
    script: v.optional(v.string()), // Rich text content
    thumbnail: v.optional(v.string()), // URL or base64
    description: v.optional(v.string()),
    agentId: v.optional(v.string()), // Content owner
    agentName: v.optional(v.string()),
    tags: v.array(v.string()),
    metadata: v.optional(v.any()), // Additional data like video URL, platform, etc.
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stage", ["stage"])
    .index("by_agentId", ["agentId"])
    .index("by_updatedAt", ["updatedAt"]),

  // Memory entries for Memory Browser
  memory_entries: defineTable({
    agentId: v.string(), // "ahawk" | "anton" | "dante" | "vincent"
    agentName: v.string(),
    filePath: v.string(), // Path to memory file
    fileName: v.string(),
    content: v.string(), // File content
    entryType: v.string(), // "memory_md" | "daily_note" | "soul_md" | "agents_md"
    date: v.optional(v.string()), // For daily notes: YYYY-MM-DD
    searchIndex: v.array(v.string()), // Keywords for search
    updatedAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_entryType", ["entryType"])
    .index("by_date", ["date"])
    .index("by_updatedAt", ["updatedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["agentId", "entryType"],
    }),
});
