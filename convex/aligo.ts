import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

interface AligoSendResult {
    success: boolean;
    code?: string;
    message?: string;
}

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
        const response = await fetch("https://api.ipify.org?format=json");
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
            console.log(`[SMS] 발송 시작 요청: ${args.customerIds.length}명`);

            // 1. 설정값 로드
            const settings = await ctx.runQuery(api.settings.getSettings);
            if (!settings?.aligoApiKey || !settings?.aligoUserId || !settings?.aligoSenderNumber) {
                console.error("[SMS] 설정 미비");
                return { success: false, message: "알리고 서버 연동 설정(API Key, User ID, 발신번호)이 완료되지 않았습니다." };
            }

            // 2. 고객사 데이터 로드
            const validCustomers: Doc<"customers">[] = [];
            for (const id of args.customerIds) {
                try {
                    const doc = await ctx.runQuery(api.customers.get, { id });
                    if (doc && doc.phoneNumber && doc.phoneNumber.trim() !== "") {
                        validCustomers.push(doc);
                    }
                } catch (e) {
                    console.error(`[SMS] 고객 데이터 로드 실패 ID ${id}:`, e);
                }
            }

            if (validCustomers.length === 0) {
                console.warn("[SMS] 발송 가능 대상 없음");
                return { success: false, message: "발송 가능한 유효 연락처를 가진 고객이 선택되지 않았습니다." };
            }

            // 3. 발송 수행
            let detectedIp: string | undefined;

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

                    const responseText = await response.text();
                    let result: { result_code?: string | number; message?: string } | null = null;
                    try {
                        result = JSON.parse(responseText);
                    } catch (e) {
                        console.error("[Aligo] JSON 파싱 에러:", responseText, e);
                        return { success: false, message: `알리고 응답 형식 오류: ${responseText.slice(0, 50)}` };
                    }

                    if (result?.result_code != "1") {
                        if (!detectedIp) {
                            detectedIp = await getOutboundIp();
                        }
                        return {
                            success: false,
                            code: String(result?.result_code || "ERR"),
                            message: String(result?.message || "Unknown error")
                        };
                    }
                    return { success: true };
                } catch (e) {
                    return { success: false, message: e instanceof Error ? e.message : String(e) };
                }
            }));

            const sents = results.filter(r => r.success);
            const errors = results.filter(r => !r.success);

            console.log(`[SMS] 전처리 완료: 성공 ${sents.length}, 실패 ${errors.length}`);

            // 모든 발송이 실패했을 때 에러 처리
            if (sents.length === 0 && errors.length > 0) {
                if (!detectedIp) detectedIp = await getOutboundIp();
                const head = errors[0];
                let errorMsg = `${head.message} (코드: ${head.code || "ERR"})`;

                if (head.code === "-101") {
                    errorMsg = `알리고 인증오류(IP 미등록). 현재 서버 IP [ ${detectedIp} ]를 알리고 사이트의 [발송 서버 IP] 메뉴에 등록해 주세요.`;
                }

                return {
                    success: false,
                    message: errorMsg,
                    serverIp: detectedIp
                };
            }

            // 4. 발송 이력 기록 (절반이라도 성공했으면 기록)
            if (sents.length > 0) {
                try {
                    await ctx.runMutation(api.campaignHistory.send, {
                        customerIds: validCustomers.map(c => c._id),
                        campaignId: args.campaignId,
                        campaignTitle: args.campaignTitle,
                    });
                } catch (historyErr) {
                    console.error("[SMS] 이력 기록 실패 (Mutation 에러):", historyErr);
                }
            }

            return {
                success: true,
                count: sents.length,
                total: validCustomers.length,
                failed: errors.length,
                serverIp: detectedIp
            };
        } catch (err) {
            console.error("[SMS] 전역 예외 발생:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                message: `서폭 예외 발생: ${errorMessage}`
            };
        }
    },
});
