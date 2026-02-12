import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 20 * 60 * 1000; // 20 minutes
const MAX_MESSAGES_PER_WINDOW = 50; // max 50 messages per 20-min window per agent
const MAX_TASK_CREATES_PER_WINDOW = 25; // max 25 task delegations per 20-min window

// Check rate limit (returns true if allowed)
async function checkRateLimit(
  ctx: any,
  agentId: string,
  type: "message" | "task" = "message"
): Promise<{ allowed: boolean; remaining: number; resetsAt: number }> {
  const now = Date.now();
  const limit = type === "task" ? MAX_TASK_CREATES_PER_WINDOW : MAX_MESSAGES_PER_WINDOW;
  
  const existing = await ctx.db
    .query("agent_rate_limits")
    .withIndex("by_agentId", (q: any) => q.eq("agentId", `${agentId}:${type}`))
    .first();

  if (!existing) {
    // First message ever
    await ctx.db.insert("agent_rate_limits", {
      agentId: `${agentId}:${type}`,
      windowStart: now,
      count: 1,
    });
    return { allowed: true, remaining: limit - 1, resetsAt: now + RATE_LIMIT_WINDOW_MS };
  }

  // Check if window has expired
  if (now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // Reset window
    await ctx.db.patch(existing._id, {
      windowStart: now,
      count: 1,
    });
    return { allowed: true, remaining: limit - 1, resetsAt: now + RATE_LIMIT_WINDOW_MS };
  }

  // Within window — check count
  if (existing.count >= limit) {
    const resetsAt = existing.windowStart + RATE_LIMIT_WINDOW_MS;
    return { allowed: false, remaining: 0, resetsAt };
  }

  // Increment
  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
  });
  return { allowed: true, remaining: limit - (existing.count + 1), resetsAt: existing.windowStart + RATE_LIMIT_WINDOW_MS };
}

// Send a message (rate-limited)
export const send = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limit check
    const rateCheck = await checkRateLimit(ctx, args.from, "message");
    if (!rateCheck.allowed) {
      const secsLeft = Math.ceil((rateCheck.resetsAt - Date.now()) / 1000);
      throw new Error(`Rate limited. ${args.from} has sent too many messages. Resets in ${secsLeft}s.`);
    }

    const id = await ctx.db.insert("agent_messages", {
      from: args.from,
      to: args.to,
      message: args.message,
      read: false,
      createdAt: Date.now(),
    });

    return { id, remaining: rateCheck.remaining, resetsAt: rateCheck.resetsAt };
  },
});

// Send message AND notify via webhook
export const sendAndNotify = action({
  args: {
    from: v.string(),
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Send the message (rate limit enforced inside mutation)
    const result = await ctx.runMutation(internal.agentMessages._send, {
      from: args.from,
      to: args.to,
      message: args.message,
    });

    // Determine webhook URL based on recipient
    let webhookUrl: string | undefined;
    if (args.to === "anton") {
      webhookUrl = process.env.ANTON_WEBHOOK_URL;
    } else if (args.to === "jhawk") {
      webhookUrl = process.env.JHAWK_WEBHOOK_URL;
    }

    if (webhookUrl) {
      // Fire with short timeout — don't block on slow webhooks
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000); // 3s max
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "agent_message",
            from: args.from,
            to: args.to,
            message: args.message,
          }),
          signal: controller.signal,
        });
      } catch (e) {
        // Timeout or network error — message is already saved, webhook is best-effort
        console.error("Webhook notification failed (non-blocking):", e);
      } finally {
        clearTimeout(timeout);
      }
    }

    return result;
  },
});

// Internal mutation (for action to call, bypasses public rate limit double-check)
export const _send = mutation({
  args: {
    from: v.string(),
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const rateCheck = await checkRateLimit(ctx, args.from, "message");
    if (!rateCheck.allowed) {
      const secsLeft = Math.ceil((rateCheck.resetsAt - Date.now()) / 1000);
      throw new Error(`Rate limited. ${args.from} has sent too many messages. Resets in ${secsLeft}s.`);
    }

    const id = await ctx.db.insert("agent_messages", {
      from: args.from,
      to: args.to,
      message: args.message,
      read: false,
      createdAt: Date.now(),
    });

    return { id, remaining: rateCheck.remaining, resetsAt: rateCheck.resetsAt };
  },
});

// Get unread messages for an agent
export const unread = query({
  args: {
    to: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_messages")
      .withIndex("by_to_read", (q) => q.eq("to", args.to).eq("read", false))
      .collect();
  },
});

// Mark messages as read
export const markRead = mutation({
  args: {
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("agent_messages")
      .withIndex("by_to_read", (q) => q.eq("to", args.to).eq("read", false))
      .collect();

    for (const msg of unread) {
      await ctx.db.patch(msg._id, { read: true });
    }
    return unread.length;
  },
});

// Get recent conversation (last 20 messages between two agents)
export const conversation = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agent_messages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(20);
  },
});

// Check rate limit status for an agent
export const rateLimitStatus = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const msgLimit = await ctx.db
      .query("agent_rate_limits")
      .withIndex("by_agentId", (q) => q.eq("agentId", `${args.agentId}:message`))
      .first();
    const taskLimit = await ctx.db
      .query("agent_rate_limits")
      .withIndex("by_agentId", (q) => q.eq("agentId", `${args.agentId}:task`))
      .first();

    const formatLimit = (limit: any, max: number) => {
      if (!limit || now - limit.windowStart >= RATE_LIMIT_WINDOW_MS) {
        return { used: 0, max, remaining: max, resetsIn: 0 };
      }
      return {
        used: limit.count,
        max,
        remaining: max - limit.count,
        resetsIn: Math.ceil((limit.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000),
      };
    };

    return {
      messages: formatLimit(msgLimit, MAX_MESSAGES_PER_WINDOW),
      tasks: formatLimit(taskLimit, MAX_TASK_CREATES_PER_WINDOW),
    };
  },
});
