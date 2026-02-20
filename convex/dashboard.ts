import { query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        try {
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);

            // 1. 총 매출액 (모든 완료된 계약 합산)
            // 데이터가 많아질 경우를 대비해 인덱스를 사용하는 것이 좋지만, 현재는 필터링을 유지하되 안전하게 처리
            const completedContracts = await ctx.db
                .query("contracts")
                .filter((q) =>
                    q.or(
                        q.eq(q.field("status"), "배송완료"),
                        q.eq(q.field("status"), "발주완료")
                    )
                )
                .collect();

            const totalSales = completedContracts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

            // 2. 신규 가망 고객 (최근 30일)
            const newLeads = await ctx.db
                .query("customers")
                .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
                .collect();
            const newLeadsCount = newLeads.length;

            // 3. 활성 캠페인 (published 상태)
            const activeCampaigns = await ctx.db
                .query("campaigns")
                .filter((q) => q.eq(q.field("status"), "published"))
                .collect();
            const activeCampaignsCount = activeCampaigns.length;

            // 4. 계약 대기 (상담중/계약진행 기준)
            const waitingContracts = await ctx.db
                .query("contracts")
                .filter((q) =>
                    q.or(
                        q.eq(q.field("status"), "상담중"),
                        q.eq(q.field("status"), "계약진행")
                    )
                )
                .collect();
            const waitingContractsCount = waitingContracts.length;

            // 5. 최근 상담 문의 (최근 계약/상담 5건)
            const recentContracts = await ctx.db
                .query("contracts")
                .order("desc")
                .take(5);

            const recentConsultations = await Promise.all(
                (recentContracts || []).map(async (c) => {
                    if (!c.customerId) return null;
                    try {
                        const customer = await ctx.db.get(c.customerId);
                        return {
                            id: c._id,
                            customerName: customer?.name || "알 수 없음",
                            productName: c.productName || "상품 정보 없음",
                            timeLabel: formatTimeAgo(c.createdAt || c._creationTime),
                            timestamp: c.createdAt || c._creationTime
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );

            // 6. 월별 매출 현황 (최근 6개월)
            const filteredConsultations = recentConsultations.filter(c => c !== null) as any[];
            const monthlySales = await getMonthlySales(ctx, sixMonthsAgo);

            return {
                totalSales,
                newLeadsCount,
                activeCampaignsCount,
                waitingContractsCount,
                recentConsultations: filteredConsultations,
                monthlySales
            };
        } catch (error) {
            console.error("Dashboard Stats Error:", error);
            // 에러 발생 시 기본값 반환하여 크래시 방지
            return {
                totalSales: 0,
                newLeadsCount: 0,
                activeCampaignsCount: 0,
                waitingContractsCount: 0,
                recentConsultations: [],
                monthlySales: []
            };
        }
    },
});

function formatTimeAgo(timestamp: number) {
    if (!timestamp) return "정보 없음";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    if (minutes < 0) return "방금 전";
    return "방금 전";
}

async function getMonthlySales(ctx: QueryCtx, since: number) {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            name: `${d.getMonth() + 1}월`,
            start: d.getTime(),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime(),
            total: 0
        });
    }

    // 성능 최적화: 최근 6개월 데이터만 가져옴
    const recentContracts = await ctx.db
        .query("contracts")
        .filter((q) => q.gte(q.field("_creationTime"), since))
        .collect();

    months.forEach(month => {
        month.total = recentContracts
            .filter((c) =>
                (c.status === "배송완료" || c.status === "발주완료") &&
                (c.createdAt || c._creationTime) >= month.start &&
                (c.createdAt || c._creationTime) <= month.end
            )
            .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    });

    return months.map(m => ({ name: m.name, value: m.total }));
}
