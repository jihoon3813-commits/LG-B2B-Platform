import { query } from "./_generated/server";
import { v } from "convex/values";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // 1. 총 매출액 (배송완료/발주완료 기준)
        const completedContracts = await ctx.db
            .query("contracts")
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "배송완료"),
                    q.eq(q.field("status"), "발주완료")
                )
            )
            .collect();
        const totalSales = completedContracts.reduce((sum, c) => sum + (c.amount || 0), 0);

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

        const recentConsultations = await Promise.all(recentContracts.map(async (c) => {
            const customer = await ctx.db.get(c.customerId);
            return {
                id: c._id,
                customerName: customer?.name || "알 수 없음",
                productName: c.productName || "상품 정보 없음",
                timeLabel: formatTimeAgo(c.createdAt || c._creationTime),
                timestamp: c.createdAt || c._creationTime
            };
        }));

        // 6. 월별 매출 현황 (최근 6개월)
        const monthlySales = await getMonthlySales(ctx);

        return {
            totalSales,
            newLeadsCount,
            activeCampaignsCount,
            waitingContractsCount,
            recentConsultations,
            monthlySales
        };
    },
});

function formatTimeAgo(timestamp: number) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
}

async function getMonthlySales(ctx: any) {
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

    const contracts = await ctx.db.query("contracts").collect();

    months.forEach(month => {
        month.total = contracts
            .filter((c: any) =>
                (c.status === "배송완료" || c.status === "발주완료") &&
                (c.createdAt || c._creationTime) >= month.start &&
                (c.createdAt || c._creationTime) <= month.end
            )
            .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    });

    return months.map(m => ({ name: m.name, value: m.total }));
}
