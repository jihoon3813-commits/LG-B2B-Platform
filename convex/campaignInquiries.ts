import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 상담 신청 등록
export const submit = mutation({
    args: {
        campaignId: v.id("campaigns"),
        name: v.string(),
        phoneNumber: v.string(),
        company: v.optional(v.string()),
        email: v.optional(v.string()),
        memo: v.optional(v.string()),
        formData: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign) throw new Error("캠페인을 찾을 수 없습니다.");

        const inquiryId = await ctx.db.insert("campaign_inquiries", {
            campaignId: args.campaignId,
            campaignTitle: campaign.title,
            name: args.name,
            phoneNumber: args.phoneNumber,
            company: args.company,
            email: args.email,
            memo: args.memo,
            formData: args.formData,
            status: "대기",
            createdAt: Date.now(),
        });

        // 상담 신청이 들어오면 고객 DB에도 자동으로 추가/업데이트 시도할 수 있음
        // 여기서는 일단 인콰이어리 저장에 집중

        return inquiryId;
    },
});

// 상담 신청 내역 목록
export const list = query({
    args: { campaignId: v.optional(v.id("campaigns")) },
    handler: async (ctx, args) => {
        try {
            const q = ctx.db.query("campaign_inquiries");

            if (args.campaignId) {
                // 특정 캠페인 기준 조회
                // by_campaign 인덱스가 없을 경우를 대비해 필터로 처리할 수도 있지만, 
                // 인덱스가 필수라면 스키마 동기화가 필요함.
                return await q
                    .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
                    .order("desc")
                    .collect();
            }

            // 전체 조회 (인덱스가 없을 경우를 대비해 기본 order 사용)
            // by_createdAt 인덱스 대신 기본 _creationTime을 쓰는 것이 운영 서버에서 더 안전함
            return await q.order("desc").collect();
        } catch (error) {
            console.error("campaignInquiries:list error:", error);
            return []; // 에러 시 빈 배열 반환하여 클라이언트 크래시 방지
        }
    },
});

// 상태 업데이트
export const updateStatus = mutation({
    args: {
        id: v.id("campaign_inquiries"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});

// 삭제
export const remove = mutation({
    args: { id: v.id("campaign_inquiries") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
