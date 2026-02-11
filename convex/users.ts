import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 로그인 (이메일, 비밀번호 확인)
export const login = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        // Self-healing: 초기 admin 계정이 없으면 로그인 시 자동 생성
        if (!user && args.email === "admin@lifenjoy.com" && args.password === "1234") {
            const userId = await ctx.db.insert("users", {
                email: args.email,
                password: args.password,
                name: "Super Admin",
                role: "admin",
                lastLogin: Date.now(),
            });
            user = await ctx.db.get(userId);
        }

        if (!user) {
            return { success: false, message: "User not found" };
        }

        if (user.password !== args.password) {
            return { success: false, message: "Incorrect password" };
        }

        // 로그인 성공 시 마지막 접속 시간 갱신
        await ctx.db.patch(user._id, { lastLogin: Date.now() });

        return {
            success: true,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        };
    },
});

// 내 정보 조회
export const getMe = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

// 정보 수정
export const updateProfile = mutation({
    args: {
        id: v.id("users"),
        name: v.optional(v.string()),
        password: v.optional(v.string()), // 새 비밀번호
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        await ctx.db.patch(id, fields);
    },
});

// (Deprecated) Seed Admin - 이제 login 함수에서 자동 처리하므로 필수는 아님
export const seedAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        const email = "admin@lifenjoy.com";
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existing) {
            return { success: false, message: "Admin account already exists" };
        }

        await ctx.db.insert("users", {
            email,
            password: "1234",
            name: "Super Admin",
            role: "admin",
            lastLogin: Date.now(),
        });

        return { success: true, message: "Admin account created" };
    },
});
