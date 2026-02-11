import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {
        category: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        let products;
        if (args.category) {
            const allProducts = await ctx.db.query("products").collect();
            products = allProducts.filter(p => p.category === args.category);
        } else {
            products = await ctx.db.query("products").collect();
        }
        return products;
    },
});

export const getByModelName = query({
    args: { modelName: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("products")
            .withIndex("by_modelName", (q) => q.eq("modelName", args.modelName))
            .first();
    },
});

export const create = mutation({
    args: {
        modelName: v.string(),
        name: v.string(),
        category: v.string(),
        subCategory: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        detailImageUrl: v.optional(v.string()),
        stock: v.optional(v.number()),

        // 일시불 가격
        price: v.number(),
        discountPrice: v.optional(v.number()),

        // 구독 가격 (60개월 / 72개월)
        subscriptionPrice60: v.optional(v.number()),
        subscriptionDiscountPrice60: v.optional(v.number()),
        subscriptionPrice72: v.optional(v.number()),
        subscriptionDiscountPrice72: v.optional(v.number()),

        specs: v.optional(v.any()),
        isAutoFetched: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("products")
            .withIndex("by_modelName", (q) => q.eq("modelName", args.modelName))
            .first();

        if (existing) {
            throw new Error("Product with this model name already exists");
        }

        const productId = await ctx.db.insert("products", {
            ...args,
            lastFetchedAt: Date.now(),
        });
        return productId;
    },
});

export const update = mutation({
    args: {
        id: v.id("products"),
        modelName: v.optional(v.string()),
        name: v.optional(v.string()),
        category: v.optional(v.string()),
        subCategory: v.optional(v.string()),

        // 일시불 가격
        price: v.optional(v.number()),
        discountPrice: v.optional(v.number()),

        // 구독 가격
        subscriptionPrice60: v.optional(v.number()),
        subscriptionDiscountPrice60: v.optional(v.number()),
        subscriptionPrice72: v.optional(v.number()),
        subscriptionDiscountPrice72: v.optional(v.number()),

        stock: v.optional(v.number()),
        thumbnailUrl: v.optional(v.string()),
        detailImageUrl: v.optional(v.string()),
        specs: v.optional(v.any()),
        isAutoFetched: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const removeMany = mutation({
    args: { ids: v.array(v.id("products")) },
    handler: async (ctx, args) => {
        await Promise.all(args.ids.map(id => ctx.db.delete(id)));
    },
});
