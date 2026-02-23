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
        try {
            console.log("SMS 발송 시작:", args.customerIds.length, "명");

            // 1. 설정 확인
            const settings = await ctx.runQuery(api.settings.getSettings);
            if (!settings?.aligoApiKey || !settings?.aligoUserId || !settings?.aligoSenderNumber) {
                console.error("알리고 설정 누락");
                throw new Error("알리고 설정(API Key, User ID, 발신번호)이 완료되지 않았습니다.");
            }

            // 2. 고객 데이터 가져오기
            const customers = await Promise.all(
                args.customerIds.map(async (id) => {
                    try {
                        return await ctx.runQuery(api.customers.get, { id });
                    } catch (e) {
                        console.error(`고객 데이터 로드 실패 (${id}):`, e);
                        return null;
                    }
                })
            );

            const validCustomers = customers.filter(c => c !== null && c.phoneNumber);
            if (validCustomers.length === 0) {
                throw new Error("발송 대상 고객이 없거나 모든 고객의 연락처가 누락되었습니다.");
            }

            // 3. 개별 발송 로직
            let sampleServerIp = "확인 전";
            const getOutboundIp = async () => {
                try {
                    const ipRes = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
                    const ipData = await ipRes.json();
                    return ipData.ip as string;
                } catch (e) {
                    console.warn("IP 확인 실패:", e);
                    return "확인 불가";
                }
            };

            const sendResults: AligoSendResult[] = await Promise.all(validCustomers.map(async (customer) => {
                if (!customer) return { success: false, message: "고객 정보 없음" };

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
                        signal: AbortSignal.timeout(10000) // 10초 타임아웃
                    });
                    const result = await response.json();

                    if (result.result_code != "1") {
                        if (sampleServerIp === "확인 전") sampleServerIp = await getOutboundIp();
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

            console.log(`발송 완료: 성공 ${sents.length}, 실패 ${errors.length}`);

            if (sents.length === 0 && errors.length > 0) {
                const firstErr = errors[0];
                if (firstErr.code === "-101") {
                    throw new Error(`인증오류(IP 미등록). 현재 서버 IP [ ${sampleServerIp} ]를 알리고 [발송 서버 IP]에 등록해주세요.`);
                }
                throw new Error(`${firstErr.message} (코드: ${firstErr.code || 'unknown'}) [서버 IP: ${sampleServerIp}]`);
            }

            // 4. 이력 기록
            try {
                await ctx.runMutation(api.campaignHistory.send, {
                    customerIds: validCustomers.map(c => c?._id as Id<"customers">),
                    campaignId: args.campaignId,
                    campaignTitle: args.campaignTitle,
                });
            } catch (historyErr) {
                console.error("이력 기록 실패:", historyErr);
                // 발송은 성공했으므로 중단하지 않음
            }

            return {
                success: true,
                count: sents.length,
                total: validCustomers.length,
                failed: errors.length
            };
        } catch (globalErr: any) {
            console.error("알리고 액션 전체 오류:", globalErr);
            // 에러 메시지를 정제하여 다시 던짐 (Client에서 볼 수 있도록)
            throw new Error(globalErr.message || "알 수 없는 서버 오류가 발생했습니다.");
        }
    },
});
