// Force reload trigger
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 캠페인 생성
export const create = mutation({
    args: {
        title: v.string(),
        blocks: v.any(), // JSON
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const campaignId = await ctx.db.insert("campaigns", {
            title: args.title,
            blocks: args.blocks,
            status: args.status,
            viewCount: 0,
        });
        return campaignId;
    },
});

// 캠페인 수정
export const update = mutation({
    args: {
        id: v.id("campaigns"),
        title: v.optional(v.string()),
        blocks: v.optional(v.any()),
        status: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
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
        return await ctx.db.query("campaigns").order("desc").collect();
    },
});

// 캠페인 상세 조회 (Editor용)
export const get = query({
    args: { id: v.id("campaigns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
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
