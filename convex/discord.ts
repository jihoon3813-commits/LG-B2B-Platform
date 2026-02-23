import { action } from "./_generated/server";
import { v } from "convex/values";
import axios from "axios";

export const notifyInquiry = action({
    args: {
        webhookUrl: v.string(),
        campaignTitle: v.string(),
        name: v.string(),
        phoneNumber: v.string(),
        company: v.optional(v.string()),
        email: v.optional(v.string()),
        memo: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            // 디스코드 메시지 구성 (Embed 스타일)
            const embed = {
                title: "🔔 새로운 상담 신청이 접수되었습니다!",
                color: 0x00ff00, // 초록색
                fields: [
                    { name: "캠페인", value: args.campaignTitle, inline: false },
                    { name: "이름", value: args.name, inline: true },
                    { name: "연락처", value: args.phoneNumber, inline: true },
                    { name: "회사/소속", value: args.company || "-", inline: true },
                    { name: "이메일", value: args.email || "-", inline: false },
                    { name: "메모", value: args.memo || "내용 없음", inline: false },
                ],
                timestamp: new Date().toISOString(),
                footer: { text: "LG B2B Platform Notification" }
            };

            // 웹훅 전송
            await axios.post(args.webhookUrl, {
                embeds: [embed]
            });

            console.log("[Discord] 알림 전송 성공");
        } catch (error) {
            console.error("[Discord] 알림 전송 실패:", error);
        }
    }
});
