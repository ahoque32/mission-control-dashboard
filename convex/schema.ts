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
  }).index("by_updatedAt", ["updatedAt"]),

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
