import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 설정 조회 (싱글톤 패턴: 항상 하나의 설정값만 존재하도록 관리)
export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("system_settings").first();
    },
});

// 설정 업데이트 (Upsert 방식)
export const updateSettings = mutation({
    args: {
        googleApiKey: v.optional(v.string()),
        googleCx: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("system_settings").first();

        if (existing) {
            // 기존 설정이 있으면 업데이트
            await ctx.db.patch(existing._id, {
                ...args,
                updatedAt: Date.now(),
            });
        } else {
            // 설정이 없으면 새로 생성
            await ctx.db.insert("system_settings", {
                ...args,
                updatedAt: Date.now(),
            });
        }
        return { success: true };
    },
});
