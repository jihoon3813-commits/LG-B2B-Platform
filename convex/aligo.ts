import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import axios from "axios";

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
        const response = await axios.get("https://api.ipify.org?format=json", { timeout: 3000 });
        return response.data.ip;
    } catch (e) {
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
                return { success: false, message: "알리고 서버 연동 설정이 누락되었습니다." };
            }

            // 2. 고객 데이터 로드 (개별 쿼리로 수행하여 모듈 의존성 문제 회피)
            const targets = [];
            for (const id of args.customerIds) {
                try {
                    const customer = await ctx.runQuery(api.customers.get, { id });
                    if (customer?.phoneNumber) {
                        targets.push(customer);
                    }
                } catch (e) {
                    console.error(`고객(ID: ${id}) 로드 실패`);
                }
            }

            if (targets.length === 0) {
                return { success: false, message: "발송 가능한 연락처를 가진 고객이 없습니다." };
            }

            // 3. 순차 발송 (청크 처리)
            let successCount = 0;
            let failCount = 0;
            let lastErrorMessage = "";
            let apiCode = "";
            let detectedIp: string | undefined;

            const CHUNK_SIZE = 3;
            for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
                const chunk = targets.slice(i, i + CHUNK_SIZE);

                await Promise.all(chunk.map(async (customer) => {
                    const msg = args.message.replace(/#{고객명}/g, customer.name);
                    const receiver = customer.phoneNumber.replace(/[^0-9]/g, "");

                    const params = new URLSearchParams();
                    params.append("key", settings.aligoApiKey!);
                    params.append("user_id", settings.aligoUserId!);
                    params.append("sender", settings.aligoSenderNumber!);
                    params.append("receiver", receiver);
                    params.append("msg", msg);
                    params.append("title", args.campaignTitle);

                    try {
                        const res = await axios.post("https://apis.aligo.in/send/", params, {
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            timeout: 10000
                        });

                        const result = res.data;
                        if (result.result_code == "1") {
                            successCount++;
                        } else {
                            failCount++;
                            apiCode = String(result.result_code);
                            lastErrorMessage = String(result.message);
                        }
                    } catch (e: any) {
                        failCount++;
                        lastErrorMessage = e.message || "Network Error";
                    }
                }));
            }

            // 모든 발송이 실패한 경우 IP 확인 및 상세 에러 구성
            if (successCount === 0 && failCount > 0) {
                detectedIp = await getOutboundIp();
                let errorDetails = `${lastErrorMessage} (코드: ${apiCode})`;
                if (apiCode === "-101") {
                    errorDetails = `인증오류(IP 미등록). 현재 서버 IP [ ${detectedIp} ]를 알리고 사이트에 등록해주세요.`;
                }
                return { success: false, message: errorDetails, serverIp: detectedIp };
            }

            // 4. 발송 이력 기록
            if (successCount > 0) {
                try {
                    await ctx.runMutation(api.campaignHistory.send, {
                        customerIds: targets.map(c => c._id),
                        campaignId: args.campaignId,
                        campaignTitle: args.campaignTitle,
                    });
                } catch (e) {
                    console.error("이력 기록 실패");
                }
            }

            return {
                success: true,
                count: successCount,
                total: targets.length,
                failed: failCount,
                serverIp: detectedIp
            };

        } catch (err: any) {
            console.error("전역 에러 발생:", err);
            return { success: false, message: `서버 내부 오류: ${err.message}` };
        }
    },
});
