/**
 * Kimi Chat Messages — Persistent chat history
 *
 * Stores user + assistant messages so conversations survive page refresh.
 * Auto-cleanup: if the latest message in a conversation is >5 days old,
 * the entire conversation is purged.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Save a single chat message.
 */
export const saveMessage = mutation({
  args: {
    sessionId: v.string(),
    role: v.string(),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          filename: v.string(),
          type: v.string(),
          sizeBytes: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    if (!["user", "assistant"].includes(args.role)) {
      throw new Error(`Invalid role: ${args.role}`);
    }

    return await ctx.db.insert("kimi_chat_messages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      attachments: args.attachments,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all messages for a conversation, ordered by createdAt ascending.
 */
export const getConversation = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kimi_chat_messages")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .order("asc")
      .collect();
  },
});

/**
 * Check if a conversation's latest message is older than 5 days.
 * Returns true if the conversation is stale (or empty).
 */
export const isConversationStale = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("kimi_chat_messages")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .order("desc")
      .take(1);

    // Empty conversation = NOT stale (it's new, nothing to clean up)
    if (messages.length === 0) return false;

    const latestMessage = messages[0];
    return Date.now() - latestMessage.createdAt > FIVE_DAYS_MS;
  },
});

/**
 * Clear all messages for a conversation.
 * Only clears if the LATEST message is >5 days old (don't delete mid-conversation).
 */
export const clearOldMessages = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check the latest message first
    const latest = await ctx.db
      .query("kimi_chat_messages")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .order("desc")
      .take(1);

    // Nothing to clear
    if (latest.length === 0) return { cleared: 0 };

    // Only clear if the latest message is stale
    if (Date.now() - latest[0].createdAt <= FIVE_DAYS_MS) {
      return { cleared: 0, reason: "conversation still active" };
    }

    // Delete all messages in this conversation
    const allMessages = await ctx.db
      .query("kimi_chat_messages")
      .withIndex("by_sessionId_createdAt", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .collect();

    for (const msg of allMessages) {
      await ctx.db.delete(msg._id);
    }

    return { cleared: allMessages.length };
  },
});

/**
 * Clear ALL stale conversations across the entire table.
 * Useful as a periodic cleanup (call on page load).
 */
export const clearAllStaleConversations = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FIVE_DAYS_MS;
    let totalCleared = 0;

    // Get all messages older than the cutoff
    // Group by sessionId and check the latest per group
    const allMessages = await ctx.db
      .query("kimi_chat_messages")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    // Group by sessionId, find sessions where the latest is stale
    const sessionLatest = new Map<string, number>();
    for (const msg of allMessages) {
      const existing = sessionLatest.get(msg.sessionId);
      if (!existing || msg.createdAt > existing) {
        sessionLatest.set(msg.sessionId, msg.createdAt);
      }
    }

    // Find stale sessions
    const staleSessions = new Set<string>();
    for (const [sessionId, latestTs] of sessionLatest) {
      if (latestTs < cutoff) {
        staleSessions.add(sessionId);
      }
    }

    // Delete messages from stale sessions
    for (const msg of allMessages) {
      if (staleSessions.has(msg.sessionId)) {
        await ctx.db.delete(msg._id);
        totalCleared++;
      }
    }

    return { cleared: totalCleared, staleSessions: staleSessions.size };
  },
});
