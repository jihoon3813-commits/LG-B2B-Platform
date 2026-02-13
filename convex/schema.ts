// Schema update trigger
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // 관리자 및 운영자 계정
    users: defineTable({
        email: v.string(),
        password: v.string(), // 추후 해시 처리 필요
        name: v.string(),
        role: v.union(v.literal("admin"), v.literal("staff")), // admin: 최고관리자, staff: 운영자
        lastLogin: v.optional(v.number()),
    }).index("by_email", ["email"]),

    // 고객 그룹 관리
    groups: defineTable({
        name: v.string(),
        color: v.optional(v.string()), // 그룹 식별 컬러
        description: v.optional(v.string()),
        createdAt: v.number(),
    }),

    // 고객 관리
    customers: defineTable({
        name: v.string(),
        phoneNumber: v.string(),
        company: v.optional(v.string()), // 회사/소속
        email: v.optional(v.string()),
        groupId: v.optional(v.id("groups")), // 소속 그룹
        grade: v.optional(v.string()), // 고객 등급
        tags: v.optional(v.array(v.string())), // 관심사 태그 등
        memo: v.optional(v.string()),
        source: v.optional(v.string()), // 유입 경로 (캠페인, 지인, 기타)
        status: v.string(), // 가망 고객, 캠페인 발송, 상담 등록, 관심 고객, 제외대상
        lastCampaignName: v.optional(v.string()), // 최근 발송한 캠페인 이름
        lastSentDate: v.optional(v.number()),    // 최근 발송 일시
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_group", ["groupId"])
        .searchIndex("search_name", {
            searchField: "name",
            filterFields: ["status", "groupId"],
        }),

    // 제품 관리
    products: defineTable({
        modelName: v.string(), // 모델명 (Unique Key 역할)
        name: v.string(),      // 제품명
        category: v.string(),  // 대분류 (일시불, 가전구독)
        subCategory: v.optional(v.string()), // 소분류 (TV, 냉장고...)

        // 이미지
        thumbnailUrl: v.optional(v.string()),
        detailImageUrl: v.optional(v.string()), // 상세페이지 이미지

        // 공통 가격 정보
        price: v.number(),         // 소비자가 (일시불 정상가)
        discountPrice: v.optional(v.number()), // 할인가 (일시불 판매가)

        // 가전구독 전용 가격 정보
        subscriptionPrice60: v.optional(v.number()), // 60개월 정상가
        subscriptionDiscountPrice60: v.optional(v.number()), // 60개월 할인가
        subscriptionPrice72: v.optional(v.number()), // 72개월 정상가
        subscriptionDiscountPrice72: v.optional(v.number()), // 72개월 할인가

        stock: v.optional(v.number()), // 재고
        specs: v.optional(v.any()),    // 기타 스펙 (JSON)
        isAutoFetched: v.boolean(),    // 크롤링 여부
        lastFetchedAt: v.optional(v.number()), // 마지막 크롤링 시간
    }).index("by_modelName", ["modelName"]),

    campaigns: defineTable({
        title: v.string(),
        blocks: v.any(), // JSON Array of widgets: [{type: 'text', content: 'hello'}, ...]
        status: v.string(), // "draft" | "published"
        thumbnailUrl: v.optional(v.string()),
        slug: v.optional(v.string()), // Short URL identifier
        ogImage: v.optional(v.string()), // SNS Share Image
        ogDescription: v.optional(v.string()), // SNS Share Description
        viewCount: v.number(),
    }).index("by_slug", ["slug"]),

    // 계약 관리
    contracts: defineTable({
        customerId: v.id("customers"),
        productId: v.optional(v.id("products")),

        // 계약용 고객 정보
        customerName: v.optional(v.string()),
        customerPhone: v.optional(v.string()),
        address: v.optional(v.string()),
        detailAddress: v.optional(v.string()),
        birthDate: v.optional(v.number()), // 생년월일 (타임스탬프)
        gender: v.optional(v.string()),    // 성별 (남성, 여성)

        contractType: v.optional(v.string()), // 일시불 / 가전구독
        status: v.string(), // 상담중, 계약진행, 발주완료, 배송완료, 상담취소, 계약취소, 발주취소

        // 빠른 조회용 상품 정보 캐시
        productName: v.optional(v.string()),
        modelName: v.optional(v.string()),

        contractDate: v.optional(v.number()), // 계약일/상담일
        installationDate: v.optional(v.number()), // 설치 예정일

        memo: v.optional(v.string()),
        amount: v.optional(v.number()), // 최종 계약 금액
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_customer", ["customerId"])
        .index("by_status", ["status"])
        .index("by_createdAt", ["createdAt"]),

    // 캠페인 관리


    // 캠페인 발송 히스토리
    campaignHistory: defineTable({
        customerId: v.id("customers"),
        campaignId: v.id("campaigns"),
        campaignTitle: v.string(),
        sentAt: v.number(),
    }).index("by_customer", ["customerId"]),

    // 시스템 설정 (추가됨)
    system_settings: defineTable({
        googleApiKey: v.optional(v.string()),
        googleCx: v.optional(v.string()),
        updatedAt: v.optional(v.number()),
    }),
});