"use server";

import axios from "axios";
import * as cheerio from "cheerio";

interface ProductData {
    name: string;
    thumbnailUrl: string;
    detailImageUrl: string;
    price: number;
    specs: Record<string, string>;
    isFound: boolean;
}

export async function fetchProductInfo(modelName: string): Promise<ProductData> {
    try {
        // LG전자 검색 페이지를 통해 제품 링크 찾기 (가정)
        // 실제로는 검색 API나 패턴을 알아야 하므로, 여기서는 예시로 "제품 상세 페이지" 직접 접속 시도
        // 혹은 검색 결과 목록에서 첫 번째 항목을 파싱하는 로직이 필요함.

        // 1. 검색 페이지 요청
        const searchUrl = `https://www.lge.co.kr/search/result?searchKeyword=${encodeURIComponent(modelName)}`;
        console.log(`Searching for ${modelName} at ${searchUrl}`);

        // NOTE: LG전자 사이트는 동적 렌더링(CSR)일 가능성이 높으므로, 단순 axios로는 실패할 수 있음.
        // 이 경우 Puppeteer가 필요하지만, 일단 axios + cheerio로 시도.
        // 만약 실패하면 "직접 관리자 입력"으로 유도하거나, Puppeteer API 서버를 별도로 구축해야 함.

        const { data: html } = await axios.get(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        });

        const $ = cheerio.load(html);

        // 2. 검색 결과 파싱 (HTML 구조에 따라 선택자 변경 필요)
        // 예시: .search-result-item .tit, .img-box img, .price-box .price
        // 실제 Selector는 사이트 구조 분석이 필요함.

        // 가상의 Selector 사용 (실제 사이트 구조 확인 후 수정 필요)
        const firstResult = $(".search-result-list li").first();
        const productName = firstResult.find(".tit").text().trim();
        const productPriceStr = firstResult.find(".price .num").text().replace(/[^0-9]/g, "");
        const imgUrl = firstResult.find(".img img").attr("src");

        // 상세 페이지로 이동하여 스펙 가져오기 (생략 - MVP에서는 썸네일/가격만)

        if (!productName) {
            // 검색 결과 없음
            console.warn(`No product found for model: ${modelName}`);
            return {
                name: "",
                thumbnailUrl: "",
                detailImageUrl: "",
                price: 0,
                specs: {},
                isFound: false,
            };
        }

        return {
            name: productName,
            thumbnailUrl: imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `https://www.lge.co.kr${imgUrl}`) : "",
            detailImageUrl: "", // 상세 이미지는 상세 페이지 접속 필요
            price: productPriceStr ? parseInt(productPriceStr, 10) : 0,
            specs: {},
            isFound: true,
        };

    } catch (error) {
        console.error("Crawling failed:", error);
        return {
            name: "",
            thumbnailUrl: "",
            detailImageUrl: "",
            price: 0,
            specs: {},
            isFound: false,
        };
    }
}
