import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 캠페인 발송 처리
export const send = mutation({
    args: {
        customerIds: v.array(v.id("customers")),
        campaignId: v.id("campaigns"),
        campaignTitle: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        for (const customerId of args.customerIds) {
            // 1. 고객 정보 업데이트 (최근 발송 캠페인)
            await ctx.db.patch(customerId, {
                lastCampaignName: args.campaignTitle,
                lastSentDate: now,
                updatedAt: now,
            });

            // 2. 발송 히스토리 기록
            await ctx.db.insert("campaignHistory", {
                customerId,
                campaignId: args.campaignId,
                campaignTitle: args.campaignTitle,
                sentAt: now,
            });
        }
    },
});

// 특정 고객의 발송 히스토리 조회
export const getByCustomer = query({
    args: { customerId: v.id("customers") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("campaignHistory")
            .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
            .order("desc")
            .collect();
    },
});
