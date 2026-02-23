"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Trash2, AlertCircle, MessageSquare, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";

interface Inquiry {
    _id: Id<"campaign_inquiries">;
    _creationTime: number;
    campaignId: Id<"campaigns">;
    campaignTitle: string;
    name: string;
    phoneNumber: string;
    company?: string;
    email?: string;
    memo?: string;
    formData?: any; // 지원되는 두 가지 형식: Record<string, any> (이전) 또는 {label, value}[] (신규)
    status: string;
    createdAt: number;
}

export default function CampaignInquiryListPage() {
    const inquiries = useQuery(api.campaignInquiries.list, {}) as Inquiry[] | undefined;
    const updateStatus = useMutation(api.campaignInquiries.updateStatus);
    const removeInquiry = useMutation(api.campaignInquiries.remove);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCampaign, setFilterCampaign] = useState("all");

    // Get unique campaigns for the filter
    const uniqueCampaigns = Array.from(new Set(inquiries?.map(inq => inq.campaignTitle) || []));

    const handleStatusUpdate = async (id: Id<"campaign_inquiries">, status: string) => {
        await updateStatus({ id, status });
    };

    const handleDelete = async (id: Id<"campaign_inquiries">) => {
        if (confirm("정말로 삭제하시겠습니까?")) {
            await removeInquiry({ id });
        }
    };

    const filteredInquiries = inquiries?.filter((inq: Inquiry) => {
        const matchesSearch =
            inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inq.phoneNumber.includes(searchTerm) ||
            inq.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inq.company?.toLowerCase().includes(searchTerm.toLowerCase() ?? ""));

        const matchesStatus = filterStatus === "all" || inq.status === filterStatus;
        const matchesCampaign = filterCampaign === "all" || inq.campaignTitle === filterCampaign;

        return matchesSearch && matchesStatus && matchesCampaign;
    });

    const statusColors: Record<string, string> = {
        "대기": "bg-amber-50 text-amber-600 border-amber-200",
        "진행중": "bg-blue-50 text-blue-600 border-blue-200",
        "완료": "bg-green-50 text-green-600 border-green-200",
        "거절": "bg-red-50 text-red-600 border-red-200"
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                        캠페인 상담 신청 내역
                    </h1>
                    <p className="text-gray-500">랜딩 페이지를 통해 접수된 상담 신청 목록을 관리합니다.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="이름, 연락처, 캠페인명 검색..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        value={filterCampaign}
                        onChange={(e) => setFilterCampaign(e.target.value)}
                    >
                        <option value="all">모든 캠페인</option>
                        {uniqueCampaigns.map(title => (
                            <option key={title} value={title}>{title}</option>
                        ))}
                    </select>
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">모든 상태</option>
                        <option value="대기">대기</option>
                        <option value="진행중">상담중</option>
                        <option value="완료">완료</option>
                        <option value="거절">거절</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">No.</th>
                                <th className="px-6 py-4 w-40">신청날짜</th>
                                <th className="px-6 py-4 w-48">캠페인명</th>
                                <th className="px-6 py-4 w-32">이름</th>
                                <th className="px-6 py-4 w-40">연락처</th>
                                <th className="px-6 py-4">메모 / 추가정보</th>
                                <th className="px-6 py-4 w-32">상태</th>
                                <th className="px-6 py-4 w-16 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-600">
                            {filteredInquiries?.map((inquiry: Inquiry, index: number) => {
                                // Extract extra fields from formData if it's an array
                                const SKIP_LABELS = ['이름', '연락처', '성함', '휴대폰', '전화번호', '핸드폰', '폰번호', '전화', '상담 내용', '상담내용', '문의사항', '문의 내용'];

                                const extraInfo = Array.isArray(inquiry.formData)
                                    ? inquiry.formData
                                        .filter((f: any) => f && f.label && !SKIP_LABELS.includes(f.label) && !String(f.value).includes('[object Object]'))
                                        .map((f: any) => `${f.label}: ${f.value}`).join(' / ')
                                    : inquiry.formData
                                        ? Object.entries(inquiry.formData)
                                            .filter(([k, v]) => !SKIP_LABELS.includes(k) && !String(v).includes('[object Object]'))
                                            .map(([k, v]) => `${k}: ${v}`).join(' / ')
                                        : '';

                                return (
                                    <tr key={inquiry._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium text-gray-400">
                                            {(filteredInquiries?.length || 0) - index}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-blue-600 truncate max-w-[180px]" title={inquiry.campaignTitle}>
                                                    {inquiry.campaignTitle}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 border-l-4 border-transparent hover:border-blue-500 pl-4 transition-all">
                                            {inquiry.name}
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            {inquiry.phoneNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md">
                                                {inquiry.memo && <p className="font-medium text-gray-800 mb-1">{inquiry.memo}</p>}
                                                {extraInfo && (
                                                    <p className="text-[11px] text-gray-400 leading-tight">
                                                        {extraInfo}
                                                    </p>
                                                )}
                                                {!inquiry.memo && !extraInfo && <span className="text-gray-300 italic">남긴 내용 없음</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className={`w-full p-1.5 rounded-lg text-xs font-bold outline-none border transition-all ${statusColors[inquiry.status]}`}
                                                value={inquiry.status}
                                                onChange={(e) => handleStatusUpdate(inquiry._id, e.target.value)}
                                            >
                                                <option value="대기">대기</option>
                                                <option value="진행중">상담중</option>
                                                <option value="완료">완료</option>
                                                <option value="거절">거절</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(inquiry._id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {(!filteredInquiries || filteredInquiries.length === 0) && (
                    <div className="py-20 text-center text-gray-400 border-t border-gray-50">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        상담 신청 내역이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
