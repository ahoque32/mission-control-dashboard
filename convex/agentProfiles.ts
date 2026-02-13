import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByProfileId = query({
  args: { profileId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_profiles")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .first();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agent_profiles").collect();
  },
});

export const upsert = mutation({
  args: {
    profileId: v.string(),
    version: v.string(),
    lastUpdatedBy: v.string(),
    identity: v.any(),
    operatingRules: v.any(),
    sops: v.any(),
    formatting: v.any(),
    boundaries: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agent_profiles")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        version: args.version,
        lastUpdatedBy: args.lastUpdatedBy,
        lastUpdatedAt: now,
        identity: args.identity,
        operatingRules: args.operatingRules,
        sops: args.sops,
        formatting: args.formatting,
        boundaries: args.boundaries,
      });
      return existing._id;
    }

    return await ctx.db.insert("agent_profiles", {
      profileId: args.profileId,
      version: args.version,
      lastUpdatedBy: args.lastUpdatedBy,
      lastUpdatedAt: now,
      identity: args.identity,
      operatingRules: args.operatingRules,
      sops: args.sops,
      formatting: args.formatting,
      boundaries: args.boundaries,
    });
  },
});
