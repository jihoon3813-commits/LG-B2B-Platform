import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

interface SMSResponse {
    success: boolean;
    message?: string;
    count?: number;
    total?: number;
    failed?: number;
    serverIp?: string;
}

/**
 * 전송 서버의 공인 IP를 확인합니다. (알리고 IP 등록용)
 */
async function getOutboundIp(): Promise<string> {
    try {
        const response = await fetch("https://api.ipify.org?format=json", {
            signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) return "IP 조회 응답 실패";
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
            console.log(`[SMS] 발송 프로세스 시작: ${args.customerIds.length}명 대상`);

            // 1. 설정 및 데이터 로드
            const settings = await ctx.runQuery(api.settings.getSettings);
            if (!settings?.aligoApiKey || !settings?.aligoUserId || !settings?.aligoSenderNumber) {
                return { success: false, message: "알리고 서버 설정(API Key, User ID, 발신번호)이 되어있지 않습니다." };
            }

            const validCustomers = await ctx.runQuery(api.customers.getByIds, { ids: args.customerIds });
            const targets = (validCustomers as Doc<"customers">[]).filter(c => c.phoneNumber?.replace(/[^0-9]/g, "").length >= 10);

            if (targets.length === 0) {
                return { success: false, message: "유효한 연락처를 가진 고객이 없습니다." };
            }

            console.log(`[SMS] 유효 타겟 확인: ${targets.length}명`);

            // 2. 순차 발송 (병렬 부하 방지를 위해 묶음 발송)
            const results = [];
            let detectedIp: string | undefined;
            const CHUNK_SIZE = 5; // 한 번에 5개씩 처리

            for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
                const chunk = targets.slice(i, i + CHUNK_SIZE);
                console.log(`[SMS] 배치 발송 중... (${i + 1} ~ ${Math.min(i + CHUNK_SIZE, targets.length)})`);

                const chunkPromises = chunk.map(async (customer) => {
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
                            body: params,
                            signal: AbortSignal.timeout(10000) // 10초 타임아웃
                        });

                        const responseText = await response.text();
                        let result: any;
                        try {
                            result = JSON.parse(responseText);
                        } catch (e) {
                            return { success: false, message: `응답 해석 오류: ${responseText.slice(0, 30)}` };
                        }

                        if (result.result_code != "1") {
                            if (!detectedIp) detectedIp = await getOutboundIp();
                            return {
                                success: false,
                                code: String(result.result_code),
                                message: String(result.message)
                            };
                        }
                        return { success: true };
                    } catch (e) {
                        return { success: false, message: e instanceof Error ? e.message : String(e) };
                    }
                });

                const chunkResults = await Promise.all(chunkPromises);
                results.push(...chunkResults);
            }

            const sents = results.filter(r => r.success);
            const errors = results.filter(r => !r.success);

            console.log(`[SMS] 발송 종합: 성공 ${sents.length}, 실패 ${errors.length}`);

            if (sents.length === 0 && errors.length > 0) {
                if (!detectedIp) detectedIp = await getOutboundIp();
                const head: any = errors[0];
                let errorMsg = `${head.message} (코드: ${head.code || "ERR"})`;
                if (head.code === "-101") {
                    errorMsg = `인증오류(IP 미등록). 현재 서버 IP [ ${detectedIp} ]를 알리고 사이트에 등록해 주세요.`;
                }
                return { success: false, message: errorMsg, serverIp: detectedIp };
            }

            // 3. 이력 기록
            if (sents.length > 0) {
                try {
                    await ctx.runMutation(api.campaignHistory.send, {
                        customerIds: targets.map(c => c._id),
                        campaignId: args.campaignId,
                        campaignTitle: args.campaignTitle,
                    });
                } catch (e) {
                    console.error("[SMS] 이력 기록 Mutation 실패:", e);
                }
            }

            return {
                success: true,
                count: sents.length,
                total: targets.length,
                failed: errors.length,
                serverIp: detectedIp
            };

        } catch (globalErr) {
            console.error("[SMS] 액션 전역 에러:", globalErr);
            const msg = globalErr instanceof Error ? globalErr.message : String(globalErr);
            return { success: false, message: `서버 내부 예외: ${msg}` };
        }
    },
});
