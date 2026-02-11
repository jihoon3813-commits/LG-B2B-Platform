import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 목록 조회 (검색 및 필터링)
export const list = query({
    args: {
        status: v.optional(v.string()),
        groupId: v.optional(v.id("groups")),
        search: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let customers;

        if (args.groupId) {
            customers = await ctx.db
                .query("customers")
                .withIndex("by_group", (q) => q.eq("groupId", args.groupId!))
                .collect();
        } else if (args.status) {
            customers = await ctx.db
                .query("customers")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .collect();
        } else {
            customers = await ctx.db.query("customers").collect();
        }

        if (args.status && args.groupId) {
            customers = customers.filter(c => c.status === args.status);
        }

        if (args.startDate) {
            customers = customers.filter(c => c.createdAt >= args.startDate!);
        }

        if (args.endDate) {
            customers = customers.filter(c => c.createdAt <= args.endDate!);
        }

        // 이름 검색
        if (args.search) {
            const search = args.search.toLowerCase();
            customers = customers.filter(
                (c) =>
                    c.name.toLowerCase().includes(search) ||
                    (c.phoneNumber && c.phoneNumber.includes(search)) ||
                    (c.email && c.email.toLowerCase().includes(search)) ||
                    (c.company && c.company.toLowerCase().includes(search))
            );
        }

        // 최신순 정렬
        return customers.sort((a, b) => b.createdAt - a.createdAt);
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        company: v.optional(v.string()),
        phoneNumber: v.string(),
        email: v.optional(v.string()),
        groupId: v.optional(v.id("groups")),
        grade: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        memo: v.optional(v.string()),
        source: v.optional(v.string()),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const customerId = await ctx.db.insert("customers", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 초기 상태가 상담 등록인 경우 계약 생성
        if (args.status === "상담 등록") {
            const customer = await ctx.db.get(customerId);
            await ctx.db.insert("contracts", {
                customerId,
                customerName: customer?.name,
                customerPhone: customer?.phoneNumber,
                status: "상담중",
                contractDate: Date.now(),
                memo: "고객 등록 시 상담 등록으로 설정됨",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return customerId;
    },
});

export const update = mutation({
    args: {
        id: v.id("customers"),
        name: v.optional(v.string()),
        company: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        email: v.optional(v.string()),
        groupId: v.optional(v.id("groups")),
        grade: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        memo: v.optional(v.string()),
        status: v.optional(v.string()),
        lastCampaignName: v.optional(v.string()),
        lastSentDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;

        // 상태 변경 감지: 상담 등록으로 변경 시 계약 생성
        if (fields.status === "상담 등록") {
            const existingContract = await ctx.db
                .query("contracts")
                .withIndex("by_customer", (q) => q.eq("customerId", id))
                .filter(q => q.eq(q.field("status"), "상담중"))
                .first();

            if (!existingContract) {
                const customer = await ctx.db.get(id);
                await ctx.db.insert("contracts", {
                    customerId: id,
                    customerName: customer?.name,
                    customerPhone: customer?.phoneNumber,
                    status: "상담중",
                    contractDate: Date.now(),
                    memo: "고객관리에서 상담 등록으로 상태 변경됨",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }

        await ctx.db.patch(id, {
            ...fields,
            updatedAt: Date.now(),
        });
    },
});

export const remove = mutation({
    args: { id: v.id("customers") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const bulkMoveToGroup = mutation({
    args: {
        ids: v.array(v.id("customers")),
        groupId: v.optional(v.id("groups")),
    },
    handler: async (ctx, args) => {
        for (const id of args.ids) {
            await ctx.db.patch(id, {
                groupId: args.groupId,
                updatedAt: Date.now(),
            });
        }
    },
});
