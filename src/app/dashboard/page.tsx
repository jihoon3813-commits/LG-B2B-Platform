"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    TrendingUp,
    Users,
    FileText,
    Megaphone,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    MoreHorizontal,
    Loader2
} from "lucide-react";

export default function DashboardPage() {
    const stats = useQuery(api.dashboard.getStats);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const email = localStorage.getItem("user_email");
        if (email) setUserEmail(email);
    }, []);

    const user = useQuery(api.users.getMe, userEmail ? { email: userEmail } : "skip");

    const currentDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-400 font-bold animate-pulse">현황 데이터를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">{user?.name || "관리자"}님, 환영합니다 👋</h1>
                    <p className="text-[var(--text-sub)]">오늘의 주요 비즈니스 현황입니다.</p>
                </div>
                <div className="bg-[var(--bg-white)] px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-sub)] flex items-center shadow-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {currentDate}
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Revenue */}
                <div className="bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-[var(--primary)]" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-50 rounded-lg text-[var(--primary)]">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-[var(--success)] bg-green-50 px-2 py-1 rounded-full">
                            실시간 <ArrowUpRight className="w-3 h-3 ml-1" />
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">총 매출액</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">₩ {stats.totalSales.toLocaleString()}</p>
                </div>

                {/* Card 2: New Leads */}
                <div className="bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="w-16 h-16 text-blue-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-[var(--success)] bg-green-50 px-2 py-1 rounded-full">
                            최근 30일 <ArrowUpRight className="w-3 h-3 ml-1" />
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">신규 가망 고객</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">{stats.newLeadsCount.toLocaleString()} 명</p>
                </div>

                {/* Card 3: Campaigns */}
                <div className="bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Megaphone className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-[var(--text-sub)] bg-gray-100 px-2 py-1 rounded-full">
                            진행 중
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">활성 캠페인</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">{stats.activeCampaignsCount} 건</p>
                </div>

                {/* Card 4: Contracts */}
                <div className="bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText className="w-16 h-16 text-orange-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            진행대기 <ArrowUpRight className="w-3 h-3 ml-1" />
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">계약 대기</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">{stats.waitingContractsCount} 건</p>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">매출 현황 (최근 6개월)</h3>
                        <button className="text-[var(--text-sub)] hover:text-[var(--primary)] transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-64 flex items-end justify-between px-4 pb-4">
                        {stats.monthlySales.map((m, i) => {
                            const maxVal = Math.max(...stats.monthlySales.map(ms => ms.value), 1);
                            const height = `${(m.value / maxVal) * 100}%`;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                    <div className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        ₩{(m.value / 10000).toLocaleString()}만
                                    </div>
                                    <div
                                        className="w-8 bg-blue-100 group-hover:bg-blue-600 transition-all rounded-t-lg relative"
                                        style={{ height }}
                                    >
                                        <div className="absolute inset-0 bg-blue-600/10 rounded-t-lg opacity-0 group-hover:opacity-100 pointer-events-none"></div>
                                    </div>
                                    <div className="text-xs font-bold text-gray-400">{m.name}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Consultations List */}
                <div className="bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">최근 상담 문의</h3>
                        <button className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">더보기</button>
                    </div>
                    <div className="space-y-4">
                        {stats.recentConsultations.length === 0 ? (
                            <div className="py-10 text-center text-gray-300 italic text-sm">최근 상담 내역이 없습니다.</div>
                        ) : (
                            stats.recentConsultations.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            고객
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{c.customerName}</div>
                                            <div className="text-xs text-[var(--text-sub)] truncate max-w-[140px]">{c.productName}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 text-right whitespace-nowrap">{c.timeLabel}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
