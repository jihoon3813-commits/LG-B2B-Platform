import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";

interface AligoSendResult {
    success: boolean;
    code?: string;
    message?: string;
}

interface SMSResponse {
    success: boolean;
    count: number;
    total: number;
    failed: number;
}

/**
 * 전송 서버의 공인 IP를 확인합니다. (알리고 IP 등록용)
 */
async function getOutboundIp(): Promise<string> {
    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json() as { ip: string };
        return data.ip;
    } catch (e) {
        console.warn("IP 조회 실패:", e);
        return "확인 불가";
    }
}

/**
 * 알리고 API를 통해 문자를 발송합니다.
 */
export const sendSMS = action({
    args: {
        customerIds: v.array(v.id("customers")),
        campaignId: v.id("campaigns"),
        campaignTitle: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args): Promise<SMSResponse> => {
        try {
            console.log(`[SMS] 발송 시작: ${args.customerIds.length}명`);

            // 1. 설정값 로드
            const settings = await ctx.runQuery(api.settings.getSettings);
            if (!settings?.aligoApiKey || !settings?.aligoUserId || !settings?.aligoSenderNumber) {
                throw new Error("알리고 연동 설정(API Key, User ID, 발신번호)이 되어있지 않습니다.");
            }

            // 2. 고객사 데이터 로드
            const customerPromises = args.customerIds.map(id => ctx.runQuery(api.customers.get, { id }));
            const customerDocs = await Promise.all(customerPromises);
            const validCustomers = (customerDocs.filter(c => c !== null) as Doc<"customers">[])
                .filter(c => c.phoneNumber && c.phoneNumber.trim() !== "");

            if (validCustomers.length === 0) {
                throw new Error("발송 가능한 연락처를 가진 고객이 없습니다.");
            }

            // 3. 발송 수행
            let detectedIp = "확인 전";

            const results: AligoSendResult[] = await Promise.all(validCustomers.map(async (customer) => {
                const personalizedMsg = args.message.replace(/#{고객명}/g, customer.name);
                const receiver = customer.phoneNumber.replace(/[^0-9]/g, "");

                const params = new URLSearchParams();
                params.append("key", settings.aligoApiKey!);
                params.append("user_id", settings.aligoUserId!);
                params.append("sender", settings.aligoSenderNumber!);
                params.append("receiver", receiver);
                params.append("msg", personalizedMsg);
                params.append("title", args.campaignTitle);

                try {
                    const response = await fetch("https://apis.aligo.in/send/", {
                        method: "POST",
                        body: params
                    });
                    const result = await response.json() as { result_code: string; message: string };

                    if (result.result_code !== "1") {
                        if (detectedIp === "확인 전") {
                            detectedIp = await getOutboundIp();
                        }
                        return {
                            success: false,
                            code: result.result_code,
                            message: result.message
                        };
                    }
                    return { success: true };
                } catch (e) {
                    return { success: false, message: e instanceof Error ? e.message : String(e) };
                }
            }));

            const sents = results.filter(r => r.success);
            const errors = results.filter(r => !r.success);

            console.log(`[SMS] 발송 완료: 성공 ${sents.length}, 실패 ${errors.length}`);

            // 모든 발송이 실패했을 때 에러 처리 (IP 미등록 등)
            if (sents.length === 0 && errors.length > 0) {
                const head = errors[0];
                if (head.code === "-101") {
                    throw new Error(`인증오류(IP 미등록). 현재 서버 IP [ ${detectedIp} ]를 알리고 [발송 서버 IP]에 등록하세요.`);
                }
                throw new Error(`${head.message} (코드: ${head.code || "ERR"}) [서버 IP: ${detectedIp}]`);
            }

            // 4. 발송 이력 기록 (Mutation 호출)
            try {
                await ctx.runMutation(api.campaignHistory.send, {
                    customerIds: validCustomers.map(c => c._id),
                    campaignId: args.campaignId,
                    campaignTitle: args.campaignTitle,
                });
            } catch (historyErr) {
                console.error("[SMS] 이력 기록 실패:", historyErr);
            }

            return {
                success: true,
                count: sents.length,
                total: validCustomers.length,
                failed: errors.length
            };
        } catch (err) {
            console.error("[SMS] 액션 에러:", err);
            throw new Error(err instanceof Error ? err.message : "SMS 전송 중 예외가 발생했습니다.");
        }
    },
});
