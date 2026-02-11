"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import axios from "axios";
import * as cheerio from "cheerio";

export const fetchProductInfo = action({
    args: {
        modelName: v.string(),
        googleApiKey: v.optional(v.string()),
        googleCx: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const logs: string[] = [];
        const log = (msg: string) => {
            console.log(msg);
            logs.push(msg);
        };

        const cleanTitle = (rawTitle: string) => {
            if (!rawTitle) return "";
            let cleaned = rawTitle
                .replace(/ : .*$/, "")
                .replace(/ - .*$/, "")
                .replace(/ \| .*$/, "")
                .replace(/\.\.\.$/, "")
                .replace(/\(.*\)$/, "")
                .replace(/\[.*?\]/g, "")
                .trim();

            try {
                const safeModelName = args.modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(safeModelName, "gi");
                cleaned = cleaned.replace(regex, "").trim();
            } catch (e) { }

            return cleaned.replace(/^[\s\-_]+|[\s\-_]+$/g, "");
        };

        // 이미지 고화질 변환 함수
        const getHighResImageUrl = (url: string) => {
            if (!url) return "";
            let newUrl = url;
            if (newUrl.startsWith("//")) newUrl = "https:" + newUrl;

            // 다나와, 네이버 등 대부분 ? 뒤에 리사이징 파라미터가 붙음 -> 제거하면 원본
            // 예: .jpg?shrink=130:130 -> .jpg
            if (newUrl.includes("?")) {
                newUrl = newUrl.split("?")[0];
            }
            return newUrl;
        };

        try {
            log(`[Start] Searching for: ${args.modelName}`);
            let productInfo: any = null;

            // 1. Google API
            if (args.googleApiKey && args.googleCx) {
                // ... (Google API 로직은 위와 동일하지만, 이미지 처리에 getHighResImageUrl 적용)
                // ... (지면 관계상 생략하지 않고 전체 작성)
                try {
                    const googleUrl = `https://www.googleapis.com/customsearch/v1`;
                    const { data: googleRes } = await axios.get(googleUrl, {
                        params: { key: args.googleApiKey, cx: args.googleCx, q: args.modelName, num: 1 }
                    });

                    if (googleRes.items && googleRes.items.length > 0) {
                        const item = googleRes.items[0];
                        let price = 0;
                        let thumbnailUrl = "";
                        let detailImageUrl = "";

                        // 이미지
                        if (item.pagemap?.cse_image?.length > 0) thumbnailUrl = item.pagemap.cse_image[0].src;
                        if (item.pagemap?.metatags) {
                            const ogImage = item.pagemap.metatags.find((t: any) => t['og:image']);
                            if (ogImage) detailImageUrl = ogImage['og:image'];
                        }
                        if (!detailImageUrl) detailImageUrl = thumbnailUrl;

                        // 고화질 변환
                        thumbnailUrl = getHighResImageUrl(thumbnailUrl);
                        detailImageUrl = getHighResImageUrl(detailImageUrl);

                        if (item.pagemap?.offer?.length > 0) price = Number(item.pagemap.offer[0].price || 0);

                        if (thumbnailUrl) {
                            productInfo = {
                                modelName: args.modelName,
                                name: cleanTitle(item.title),
                                price: price,
                                thumbnailUrl: thumbnailUrl,
                                detailImageUrl: detailImageUrl,
                                category: "General",
                                description: item.snippet,
                                fetchedAt: Date.now(),
                                source: "Google API"
                            };
                        }
                    }
                } catch (e: any) {
                    log(`[Google API] Skipped.`);
                }
            }

            // 2. 다나와 (Danawa)
            if (!productInfo) {
                log("[Fallback] Searching Danawa...");
                try {
                    const danawaUrl = `https://search.danawa.com/dsearch.php?k1=${encodeURIComponent(args.modelName)}`;
                    const { data: danawaHtml } = await axios.get(danawaUrl, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            "Accept": "text/html,application/xhtml+xml,image/webp,*/*",
                            "Referer": "https://www.danawa.com/"
                        }
                    });
                    const $d = cheerio.load(danawaHtml);
                    const items = $d(".prod_item").not(".product-pot").not(".no_item");

                    if (items.length > 0) {
                        const firstItem = items.first();
                        const name = firstItem.find(".prod_name a").text().trim();
                        let imgUrl = firstItem.find(".thumb_image img").attr("data-original") || firstItem.find(".thumb_image img").attr("src");

                        // 고화질 변환
                        if (imgUrl) imgUrl = getHighResImageUrl(imgUrl);

                        if (name && imgUrl) {
                            productInfo = {
                                modelName: args.modelName,
                                name: cleanTitle(name),
                                price: 0,
                                thumbnailUrl: imgUrl,
                                detailImageUrl: imgUrl, // 다나와는 원본 이미지가 꽤 큼
                                category: "General",
                                description: firstItem.find(".prod_spec_set").text().trim(),
                                fetchedAt: Date.now(),
                                source: "Danawa"
                            };
                            log(`[Danawa] Success: ${name}`);
                        }
                    }
                } catch (e: any) {
                    log(`[Danawa] Error: ${e.message}`);
                }
            }

            // 3. DuckDuckGo & Naver (보완)
            if (!productInfo) {
                log("[Fallback] Searching DuckDuckGo...");
                try {
                    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.modelName + " 가격")}`;
                    const { data: ddgHtml } = await axios.get(ddgUrl, {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                    });
                    const $ddg = cheerio.load(ddgHtml);
                    const firstResult = $ddg(".result__body").first();

                    if (firstResult.length > 0) {
                        productInfo = {
                            modelName: args.modelName,
                            name: cleanTitle(firstResult.find(".result__title").text().trim()),
                            price: 0,
                            thumbnailUrl: "",
                            detailImageUrl: "",
                            category: "General",
                            description: firstResult.find(".result__snippet").text().trim(),
                            fetchedAt: Date.now(),
                            source: "DuckDuckGo"
                        };
                    }
                } catch (e) { }
            }

            // 네이버 쇼핑 이미지 보완
            if (productInfo && !productInfo.thumbnailUrl) { // 이미지가 없을 때만 실행
                try {
                    const naverUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(args.modelName)}`;
                    const { data: naverHtml } = await axios.get(naverUrl, {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
                    });
                    const $n = cheerio.load(naverHtml);
                    const scriptData = $n("#__NEXT_DATA__").html();
                    if (scriptData) {
                        const jsonData = JSON.parse(scriptData);
                        const item = jsonData?.props?.pageProps?.initialState?.products?.list?.[0]?.item;
                        if (item?.imageUrl) {
                            const hqImage = getHighResImageUrl(item.imageUrl);
                            productInfo.thumbnailUrl = hqImage;
                            productInfo.detailImageUrl = hqImage;
                            productInfo.source += " + Naver";
                        }
                    }
                } catch (e) { }
            }

            if (productInfo) return productInfo;
            return { error: "Not Found", logs };

        } catch (error: any) {
            log(`[Critical] ${error.message}`);
            return { error: "Critical Error", logs };
        }
    },
});
