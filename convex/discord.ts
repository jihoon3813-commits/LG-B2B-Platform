import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import axios from "axios";

export const notifyInquiry = action({
    args: {
        inquiryId: v.id("campaign_inquiries"),
    },
    handler: async (ctx, args) => {
        try {
            // 1. 설정 및 문의 정보 로드
            const settings = await ctx.runQuery(api.settings.getSettings);
            const webhookUrl = settings?.discordWebhookUrl;

            if (!webhookUrl) {
                console.log("[Discord] 웹훅 URL이 설정되어 있지 않습니다.");
                return;
            }

            const inquiries = await ctx.runQuery(api.campaignInquiries.list, {});
            const inquiry = inquiries.find(i => i._id === args.inquiryId);

            if (!inquiry) {
                console.error("[Discord] 문의 내역을 찾을 수 없습니다.");
                return;
            }

            // 2. 디스코드 메시지 구성 (Embed 스타일)
            const embed = {
                title: "🔔 새로운 상담 신청이 접수되었습니다!",
                color: 0x00ff00, // 초록색
                fields: [
                    { name: "캠페인", value: inquiry.campaignTitle || "알 수 없음", inline: false },
                    { name: "이름", value: inquiry.name, inline: true },
                    { name: "연락처", value: inquiry.phoneNumber, inline: true },
                    { name: "회사/소속", value: inquiry.company || "-", inline: true },
                    { name: "이메일", value: inquiry.email || "-", inline: false },
                    { name: "메모", value: inquiry.memo || "내용 없음", inline: false },
                ],
                timestamp: new Date(inquiry.createdAt).toISOString(),
                footer: { text: "LG B2B Platform Notification" }
            };

            // 3. 웹훅 전송
            await axios.post(webhookUrl, {
                embeds: [embed]
            });

            console.log("[Discord] 알림 전송 성공");
        } catch (error) {
            console.error("[Discord] 알림 전송 실패:", error);
        }
    }
});
