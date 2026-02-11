import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("groups").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        color: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("groups", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("groups"),
        name: v.string(),
        color: v.optional(v.string()),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("groups") },
    handler: async (ctx, args) => {
        // Find customers in this group and nullify their groupId
        const customers = await ctx.db
            .query("customers")
            .withIndex("by_group", (q) => q.eq("groupId", args.id))
            .collect();

        for (const customer of customers) {
            await ctx.db.patch(customer._id, { groupId: undefined });
        }

        await ctx.db.delete(args.id);
    },
});
