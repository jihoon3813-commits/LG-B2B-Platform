"use client";

import {
    TrendingUp,
    Users,
    FileText,
    Megaphone,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    MoreHorizontal
} from "lucide-react";

export default function DashboardPage() {
    const currentDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">관리자님, 환영합니다 👋</h1>
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
                            +12.5% <ArrowUpRight className="w-3 h-3 ml-1" />
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">총 매출액</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">₩ 128,450,000</p>
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
                            +5.2% <ArrowUpRight className="w-3 h-3 ml-1" />
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">신규 가망 고객</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">1,248 명</p>
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
                    <p className="text-2xl font-bold text-[var(--text-main)]">8 건</p>
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
                        <span className="flex items-center text-xs font-semibold text-[var(--error)] bg-red-50 px-2 py-1 rounded-full">
                            -2.4% <ArrowDownRight className="w-3 h-3 ml-1" />
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--text-sub)] mb-1">계약 대기</h3>
                    <p className="text-2xl font-bold text-[var(--text-main)]">24 건</p>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area (Placeholder) */}
                <div className="lg:col-span-2 bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">매출 현황</h3>
                        <button className="text-[var(--text-sub)] hover:text-[var(--primary)] transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-[var(--text-sub)] border border-dashed border-gray-200">
                        [차트 영역 - 데이터 연동 필요]
                    </div>
                </div>

                {/* Recent Customers List */}
                <div className="bg-[var(--bg-white)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">최근 상담 문의</h3>
                        <button className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">더보기</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                                        고객
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">홍길동 {i}</div>
                                        <div className="text-xs text-[var(--text-sub)]">LG 스타일러 렌탈 문의</div>
                                    </div>
                                </div>
                                <div className="text-xs text-[var(--text-sub)]">{i}시간 전</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
