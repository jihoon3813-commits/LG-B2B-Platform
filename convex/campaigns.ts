// Force reload trigger
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 캠페인 생성
// 캠페인 생성
export const create = mutation({
    args: {
        title: v.string(),
        blocks: v.any(), // JSON
        status: v.string(),
        thumbnailUrl: v.optional(v.string()),
        slug: v.optional(v.string()),
        ogImage: v.optional(v.string()),
        ogDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // slug 중복 체크
        if (args.slug) {
            const existing = await ctx.db
                .query("campaigns")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
                .first();
            if (existing) {
                throw new Error("이미 사용 중인 단축 주소입니다.");
            }
        }

        const campaignId = await ctx.db.insert("campaigns", {
            title: args.title,
            blocks: args.blocks,
            status: args.status,
            thumbnailUrl: args.thumbnailUrl,
            slug: args.slug,
            ogImage: args.ogImage,
            ogDescription: args.ogDescription,
            viewCount: 0,
        });
        return campaignId;
    },
});

// 캠페인 수정
// 캠페인 수정
export const update = mutation({
    args: {
        id: v.id("campaigns"),
        title: v.optional(v.string()),
        blocks: v.optional(v.any()),
        status: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        slug: v.optional(v.string()),
        ogImage: v.optional(v.string()),
        ogDescription: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;

        // slug 중복 체크 (자신 제외)
        if (fields.slug) {
            const existing = await ctx.db
                .query("campaigns")
                .withIndex("by_slug", (q) => q.eq("slug", fields.slug!))
                .first();
            if (existing && existing._id !== id) {
                throw new Error("이미 사용 중인 단축 주소입니다.");
            }
        }

        await ctx.db.patch(id, fields);
    },
});

// 캠페인 삭제
export const remove = mutation({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// 캠페인 목록 조회
export const list = query({
    args: {},
    handler: async (ctx) => {
        const campaigns = await ctx.db.query("campaigns").order("desc").collect();
        return await Promise.all(
            campaigns.map(async (c) => {
                let thumbnailUrl = c.thumbnailUrl;
                let ogImage = c.ogImage;

                // Storage ID인 경우 URL로 변환
                if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
                    thumbnailUrl = (await ctx.storage.getUrl(thumbnailUrl as any)) || undefined;
                }
                if (ogImage && !ogImage.startsWith("http")) {
                    ogImage = (await ctx.storage.getUrl(ogImage as any)) || undefined;
                }

                // 둘 다 없는 경우, 카드 목록에서 보여줄 프리뷰용 이미지 추출 (첫 번째 이미지 위젯 혹은 섹션 배경)
                let previewUrl = thumbnailUrl || ogImage;

                if (!previewUrl && c.blocks) {
                    try {
                        const sections = c.blocks as any[];
                        for (const section of sections) {
                            // 1. 섹션 배경 확인
                            if (section.style?.backgroundImage) {
                                let bg = section.style.backgroundImage;
                                if (bg && !bg.startsWith("http")) {
                                    bg = await ctx.storage.getUrl(bg as any);
                                }
                                if (bg) {
                                    previewUrl = bg;
                                    break;
                                }
                            }
                            // 2. 섹션 내 첫 번째 이미지 위젯 확인
                            if (section.children) {
                                const firstImage = section.children.find((b: any) => b.type === 'image' && b.content?.url);
                                if (firstImage) {
                                    let img = firstImage.content.url;
                                    if (img && !img.startsWith("http")) {
                                        img = await ctx.storage.getUrl(img as any);
                                    }
                                    if (img) {
                                        previewUrl = img;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error extracting preview image:", e);
                    }
                }

                return {
                    ...c,
                    thumbnailUrl: previewUrl, // UI에서는 thumbnailUrl을 주로 사용하므로 여기에 할당
                    ogImage,
                };
            })
        );
    },
});

// 캠페인 상세 조회 (Editor용)
export const get = query({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// 캠페인 상세 조회 (Slug용)
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const campaign = await ctx.db
            .query("campaigns")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        return campaign;
    },
});

// 파일 업로드 URL 생성 (Convex Storage)
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// 파일 메타데이터 조회 (URL 생성용)
export const getFileUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId as any);
    },
});
