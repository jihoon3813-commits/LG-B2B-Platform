"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Phone, Mail, MessageSquare, Clock, Trash2, AlertCircle, Building, Megaphone, Search, Filter } from "lucide-react";
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

        return matchesSearch && matchesStatus;
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
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">모든 상태</option>
                        <option value="대기">대기</option>
                        <option value="진행중">진행중</option>
                        <option value="완료">완료</option>
                        <option value="거절">거절</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredInquiries?.map((inquiry: Inquiry) => (
                    <div key={inquiry._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColors[inquiry.status].split(' ')[1].replace('text-', 'bg-')}`} />

                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold">{inquiry.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[inquiry.status]}`}>
                                                {inquiry.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                            <Megaphone className="w-3 h-3" />
                                            {inquiry.campaignTitle}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                                            <Clock className="w-3 h-3" />
                                            {new Date(inquiry.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold text-gray-700">{inquiry.phoneNumber}</span>
                                    </div>
                                    {inquiry.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <span className="text-gray-600 truncate">{inquiry.email}</span>
                                        </div>
                                    )}
                                    {inquiry.company && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Building className="w-4 h-4" />
                                            </div>
                                            <span className="text-gray-600 truncate">{inquiry.company}</span>
                                        </div>
                                    )}
                                </div>

                                {inquiry.memo && (
                                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <MessageSquare className="w-3 h-3" /> Consultation Request memo
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{inquiry.memo}</p>
                                    </div>
                                )}

                                {inquiry.formData && (Array.isArray(inquiry.formData) ? inquiry.formData.length > 0 : Object.keys(inquiry.formData).length > 0) && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {Array.isArray(inquiry.formData) ? (
                                            inquiry.formData.map((field: any, idx: number) => (
                                                <div key={idx} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 flex flex-col">
                                                    <span className="text-[10px] font-bold text-blue-400">{field.label}</span>
                                                    <span className="text-xs font-bold text-blue-700">{String(field.value)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            Object.entries(inquiry.formData).map(([label, value]) => (
                                                <div key={label} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 flex flex-col">
                                                    <span className="text-[10px] font-bold text-blue-400">{label}</span>
                                                    <span className="text-xs font-bold text-blue-700">{String(value)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex lg:flex-col gap-2 justify-end lg:justify-start lg:w-48 lg:border-l lg:pl-6 border-gray-50">
                                <div className="text-[10px] font-black text-gray-400 mb-1 lg:block hidden tracking-wide">STATUS ACTION</div>
                                <select
                                    className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${statusColors[inquiry.status]}`}
                                    value={inquiry.status}
                                    onChange={(e) => handleStatusUpdate(inquiry._id, e.target.value)}
                                >
                                    <option value="대기">대기 중</option>
                                    <option value="진행중">상담 진행중</option>
                                    <option value="완료">상담 완료</option>
                                    <option value="거절">신청 거절</option>
                                </select>
                                <button
                                    onClick={() => handleDelete(inquiry._id)}
                                    className="p-2.5 lg:w-full border border-gray-100 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="lg:inline hidden">신청 삭제</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {(!filteredInquiries || filteredInquiries.length === 0) && (
                    <div className="py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        상담 신청 내역이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
