import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

interface AligoSendResult {
    success: boolean;
    code?: string;
    message?: string;
}

export const sendSMS = action({
    args: {
        customerIds: v.array(v.id("customers")),
        campaignId: v.id("campaigns"),
        campaignTitle: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Get Aligo settings
        const settings = await ctx.runQuery(api.settings.getSettings);
        if (!settings?.aligoApiKey || !settings?.aligoUserId || !settings?.aligoSenderNumber) {
            throw new Error("알리고 설정(API Key, User ID, 발신번호)이 완료되지 않았습니다.");
        }

        // 2. Get customer data
        const customers = await Promise.all(
            args.customerIds.map(id => ctx.runQuery(api.customers.get, { id }))
        );

        // 3. Send messages individually for personalization
        let sampleServerIp = "알 수 없음";

        // Separate the logic to get current IP
        const getOutboundIp = async () => {
            try {
                const ipRes = await fetch("https://api.ipify.org?format=json");
                const ipData = await ipRes.json();
                return ipData.ip as string;
            } catch {
                return "확인 불가";
            }
        };

        const sendResults: AligoSendResult[] = await Promise.all(customers.map(async (customer) => {
            if (!customer || !customer.phoneNumber) return { success: false, message: "연락처 없음" };

            const personalizedMessage = args.message.replace(/#{고객명}/g, customer.name);
            const receiver = customer.phoneNumber.replace(/[^0-9]/g, "");

            const params = new URLSearchParams();
            params.append("key", settings.aligoApiKey!);
            params.append("user_id", settings.aligoUserId!);
            params.append("sender", settings.aligoSenderNumber!);
            params.append("receiver", receiver);
            params.append("msg", personalizedMessage);
            params.append("title", args.campaignTitle);

            try {
                const response = await fetch("https://apis.aligo.in/send/", {
                    method: "POST",
                    body: params,
                });
                const result = await response.json();

                if (result.result_code != "1") {
                    sampleServerIp = await getOutboundIp();
                    return { success: false, code: String(result.result_code), message: String(result.message) };
                }
                return { success: true };
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                return { success: false, message: errorMessage };
            }
        }));

        const sents = sendResults.filter(r => r.success);
        const errors = sendResults.filter(r => !r.success);

        if (sents.length === 0 && errors.length > 0) {
            const firstErr = errors[0];
            if (firstErr.code === "-101") {
                throw new Error(`알리고 발송 실패: 인증오류(IP 미등록). 현재 서버 IP [ ${sampleServerIp} ]를 알리고 [발송 서버 IP]에 등록해주세요.`);
            }
            throw new Error(`알리고 발송 실패: ${firstErr.message} (코드: ${firstErr.code}) [서버 IP: ${sampleServerIp}]`);
        }

        // 4. Record history
        await ctx.runMutation(api.campaignHistory.send, {
            customerIds: args.customerIds,
            campaignId: args.campaignId,
            campaignTitle: args.campaignTitle,
        });

        return { success: true, count: sents.length };
    },
});
