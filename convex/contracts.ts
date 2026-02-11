import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {
        status: v.optional(v.string()),
        search: v.optional(v.string()),
        contractType: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let contracts;
        if (args.status && args.status !== "All") {
            contracts = await ctx.db
                .query("contracts")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .collect();
        } else {
            contracts = await ctx.db.query("contracts").collect();
        }

        if (args.contractType) {
            contracts = contracts.filter(c => c.contractType === args.contractType);
        }

        if (args.startDate) {
            contracts = contracts.filter(c => (c.contractDate || 0) >= args.startDate!);
        }

        if (args.endDate) {
            contracts = contracts.filter(c => (c.contractDate || 0) <= args.endDate!);
        }

        // Join Customer and Product data
        let result = await Promise.all(
            contracts.map(async (contract) => {
                const customer = await ctx.db.get(contract.customerId);
                const product = contract.productId ? await ctx.db.get(contract.productId) : null;

                const cust = customer as any;
                const prod = product as any;

                return {
                    ...contract,
                    customer: customer ? { ...cust } : null,
                    product: product ? { ...prod } : null,
                };
            })
        );

        if (args.search) {
            const search = args.search.toLowerCase();
            result = result.filter(r =>
                (r.customerName && r.customerName.toLowerCase().includes(search)) ||
                (r.customerPhone && r.customerPhone.includes(search)) ||
                (r.productName && r.productName.toLowerCase().includes(search)) ||
                (r.modelName && r.modelName.toLowerCase().includes(search)) ||
                (r.customer?.name && r.customer.name.toLowerCase().includes(search)) ||
                (r.customer?.phoneNumber && r.customer.phoneNumber.includes(search)) ||
                (r.memo && r.memo.toLowerCase().includes(search))
            );
        }

        return result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },
});

export const create = mutation({
    args: {
        customerId: v.id("customers"),
        productId: v.optional(v.id("products")),
        customerName: v.optional(v.string()),
        customerPhone: v.optional(v.string()),
        address: v.optional(v.string()),
        detailAddress: v.optional(v.string()),
        birthDate: v.optional(v.number()),
        gender: v.optional(v.string()),
        contractType: v.optional(v.string()),
        status: v.string(),
        productName: v.optional(v.string()),
        modelName: v.optional(v.string()),
        contractDate: v.optional(v.number()),
        installationDate: v.optional(v.number()),
        memo: v.optional(v.string()),
        amount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const contractId = await ctx.db.insert("contracts", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return contractId;
    },
});

export const update = mutation({
    args: {
        id: v.id("contracts"),
        productId: v.optional(v.id("products")),
        customerName: v.optional(v.string()),
        customerPhone: v.optional(v.string()),
        address: v.optional(v.string()),
        detailAddress: v.optional(v.string()),
        birthDate: v.optional(v.number()),
        gender: v.optional(v.string()),
        contractType: v.optional(v.string()),
        status: v.optional(v.string()),
        productName: v.optional(v.string()),
        modelName: v.optional(v.string()),
        contractDate: v.optional(v.number()),
        installationDate: v.optional(v.number()),
        memo: v.optional(v.string()),
        amount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("contracts"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status,
            updatedAt: Date.now()
        });
    },
});

export const remove = mutation({
    args: { id: v.id("contracts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
