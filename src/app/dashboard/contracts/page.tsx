"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo } from "react";
import {
    Search,
    ChevronRight,
    ChevronLeft,
    Calendar,
    User,
    MapPin,
    Package,
    CreditCard,
    TrendingUp,
    Trash2,
    Save,
    X,
    Clock,
    Filter,
    FileText,
    CheckCircle,
    XCircle,
    MoreVertical,
    Phone,
    ChevronDown,
    Building
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import Script from "next/script";

declare global {
    interface Window {
        daum: any;
    }
}

const STATUS_OPTIONS = [
    "상담중",
    "계약진행",
    "발주완료",
    "배송완료",
    "상담취소",
    "계약취소",
    "발주취소"
];

const CONTRACT_TYPE_OPTIONS = ["일시불", "가전구독"];

export default function ContractsPage() {
    // Queries & Mutations
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const contracts = useQuery(api.contracts.list, {
        status: filterStatus === "All" ? undefined : filterStatus,
        search: searchTerm,
        contractType: filterType === "All" ? undefined : filterType,
        startDate: dateRange.start ? new Date(dateRange.start).getTime() : undefined,
        endDate: dateRange.end ? new Date(dateRange.end).getTime() + (24 * 60 * 60 * 1000) - 1 : undefined
    });

    const paginatedContracts = useMemo(() => {
        if (!contracts) return [];
        const startIndex = (currentPage - 1) * pageSize;
        return contracts.slice(startIndex, startIndex + pageSize);
    }, [contracts, currentPage, pageSize]);

    const totalPages = contracts ? Math.ceil(contracts.length / pageSize) : 0;

    const updateContract = useMutation(api.contracts.update);
    const deleteContract = useMutation(api.contracts.remove);
    const products = useQuery(api.products.list, {});

    // UI States
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Handle row click to open edit modal
    const openEditModal = (contract: any) => {
        const data = {
            ...contract,
            birthDate: contract.birthDate ? new Date(contract.birthDate).toISOString().split('T')[0] : "",
            contractDate: contract.contractDate ? new Date(contract.contractDate).toISOString().split('T')[0] : "",
            installationDate: contract.installationDate ? new Date(contract.installationDate).toISOString().split('T')[0] : "",
        };
        setSelectedContract(contract);
        setFormData(data);
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'customerPhone') {
            const raw = value.replace(/[^\d]/g, "");
            let formatted = raw;
            if (raw.length > 3 && raw.length <= 7) {
                formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
            } else if (raw.length > 7) {
                formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
            }
            setFormData((prev: any) => ({ ...prev, [name]: formatted }));
            return;
        }

        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: function (data: any) {
                let fullAddr = data.address;
                let extraAddr = '';

                if (data.addressType === 'R') {
                    if (data.bname !== '') {
                        extraAddr += data.bname;
                    }
                    if (data.buildingName !== '') {
                        extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    fullAddr += (extraAddr !== '' ? ' (' + extraAddr + ')' : '');
                }

                setFormData((prev: any) => ({ ...prev, address: fullAddr }));
            }
        }).open();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { birthDate, contractDate, installationDate, customer, product, _id, _creationTime, createdAt, updatedAt, ...rest } = formData;

            await updateContract({
                id: selectedContract._id,
                ...rest,
                birthDate: birthDate ? new Date(birthDate).getTime() : undefined,
                contractDate: contractDate ? new Date(contractDate).getTime() : undefined,
                installationDate: installationDate ? new Date(installationDate).getTime() : undefined,
            });

            alert("성공적으로 수정되었습니다.");
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (confirm("정말로 이 계약 정보를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
            await deleteContract({ id: selectedContract._id });
            setIsEditModalOpen(false);
            alert("삭제되었습니다.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "상담중": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "계약진행": return "bg-blue-100 text-blue-700 border-blue-200";
            case "발주완료": return "bg-purple-100 text-purple-700 border-purple-200";
            case "배송완료": return "bg-green-100 text-green-700 border-green-200";
            case "상담취소": case "계약취소": case "발주취소": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
            <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        계약 및 상담 통합 관리
                    </h1>
                    <p className="text-gray-500 font-medium">실시간 계약 현황을 모니터링하고 상담 내역을 최신으로 유지합니다.</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center col-span-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="고객명, 연락처, 품명 등으로 검색..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs outline-none"
                            value={dateRange.start}
                            onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                        />
                        <span className="text-gray-300">~</span>
                        <input
                            type="date"
                            className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs outline-none"
                            value={dateRange.end}
                            onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer appearance-none"
                    >
                        <option value={20}>20개씩 보기</option>
                        <option value={50}>50개씩 보기</option>
                        <option value={100}>100개씩 보기</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <select
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm appearance-none"
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="All">전체 상태</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <select
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm appearance-none"
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="All">전체 유형</option>
                        {CONTRACT_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            </div>

            {/* Contract List Table */}
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-8 py-5">고객명 / 연락처</th>
                                <th className="px-8 py-5">제품 정보</th>
                                <th className="px-8 py-5">계약 유형</th>
                                <th className="px-8 py-5">금액</th>
                                <th className="px-8 py-5">진행상태</th>
                                <th className="px-8 py-5">날짜</th>
                                <th className="px-8 py-5 text-right">상세</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!contracts ? (
                                <tr><td colSpan={7} className="px-8 py-32 text-center text-gray-300 italic text-sm">데이터를 불러오는 중입니다...</td></tr>
                            ) : paginatedContracts.length === 0 ? (
                                <tr><td colSpan={7} className="px-8 py-32 text-center text-gray-300 italic text-sm">조건에 맞는 검색 결과가 없습니다.</td></tr>
                            ) : (
                                paginatedContracts.map((c: any) => (
                                    <tr key={c._id} onClick={() => openEditModal(c)} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 text-sm">{c.customerName || c.customer?.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">{c.customerPhone || c.customer?.phoneNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{c.productName || c.product?.name || "상품 미지정"}</div>
                                            <div className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tight">{c.modelName || c.product?.modelName || "-"}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${c.contractType === '가전구독' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {c.contractType || "미지정"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-mono text-xs font-bold text-gray-900">
                                            {c.amount ? `₩ ${c.amount.toLocaleString()}` : "-"}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${getStatusColor(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-[10px] font-bold text-gray-400">{c.contractDate ? new Date(c.contractDate).toLocaleDateString() : "-"}</div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="p-2 hover:bg-white rounded-xl text-gray-300 group-hover:text-blue-500 transition-all inline-block">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {contracts && contracts.length > 0 && (
                    <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                        <div className="text-xs text-gray-400 font-bold">
                            전체 <span className="text-blue-600">{contracts.length}</span>건 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, contracts.length)} 표시
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "hover:bg-white text-gray-400"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                    계약 상세 정보 및 관리
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 font-bold">고객 및 계약 내용을 수정하거나 상태를 변경할 수 있습니다.</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-300 hover:text-gray-900 border border-gray-100 p-2 rounded-2xl bg-white shadow-sm transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-hidden flex">
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
                                {/* Section: Customer Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-4 h-4" /> 고객 인적사항
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2 col-span-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">성함 *</label>
                                            <input required name="customerName" value={formData.customerName || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm" />
                                        </div>
                                        <div className="space-y-2 col-span-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">연락처 *</label>
                                            <input required name="customerPhone" value={formData.customerPhone || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm" />
                                        </div>
                                        <div className="space-y-2 col-span-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">생년월일 / 성별</label>
                                            <div className="flex gap-2">
                                                <input type="date" name="birthDate" value={formData.birthDate || ""} onChange={handleInputChange} className="flex-1 px-4 py-3 border border-gray-100 rounded-2xl bg-gray-50 text-xs font-bold" />
                                                <select name="gender" value={formData.gender || ""} onChange={handleInputChange} className="w-24 px-3 py-3 border border-gray-100 rounded-2xl bg-gray-50 text-xs font-bold appearance-none">
                                                    <option value="">성별</option>
                                                    <option value="남성">남성</option>
                                                    <option value="여성">여성</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 text-xs">주소 (도로명)</label>
                                            <div className="flex gap-2">
                                                <input readOnly value={formData.address || ""} placeholder="주소 검색을 이용해주세요" className="flex-1 px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-100 font-bold text-sm outline-none" />
                                                <button type="button" onClick={handleAddressSearch} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" /> 검색
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">상세 주소</label>
                                            <input name="detailAddress" value={formData.detailAddress || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Product & Contract Details */}
                                <div className="space-y-6 pt-4 border-t border-gray-50">
                                    <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <Package className="w-4 h-4" /> 제품 및 계약 상세
                                    </h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">제품 구분</label>
                                            <select name="contractType" value={formData.contractType || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-indigo-100 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm outline-none appearance-none">
                                                <option value="">선택하세요</option>
                                                {CONTRACT_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">제품명</label>
                                            <input name="productName" value={formData.productName || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">모델명</label>
                                            <input name="modelName" value={formData.modelName || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm uppercase" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">결제/구독 금액</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={formData.amount || ""}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-mono font-bold text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-bold pl-1 italic">
                                                {formData.contractType === '가전구독' ? "* 구독료는 월 납입금 기준" : "* 일시불은 최종 판매가 기준"}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">진행 상황 현황 *</label>
                                            <select name="status" value={formData.status || ""} onChange={handleInputChange} className="w-full px-5 py-3.5 border border-blue-100 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm outline-none appearance-none">
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">계약일 / 설치예정일</label>
                                            <div className="flex gap-2">
                                                <input type="date" name="contractDate" value={formData.contractDate || ""} onChange={handleInputChange} className="flex-1 px-3 py-3 border border-gray-100 rounded-2xl bg-gray-50 text-[10px] font-bold" />
                                                <input type="date" name="installationDate" value={formData.installationDate || ""} onChange={handleInputChange} className="flex-1 px-3 py-3 border border-gray-100 rounded-2xl bg-gray-50 text-[10px] font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">상담 특이사항 및 관리 메모</label>
                                    <textarea name="memo" value={formData.memo || ""} onChange={handleInputChange} className="w-full p-6 border border-gray-100 rounded-3xl bg-gray-50 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm h-32 resize-none" />
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                                    <button type="button" onClick={handleDelete} className="px-6 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-sm flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" /> 정보 삭제
                                    </button>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 text-gray-400 font-black hover:text-gray-900 transition-all">취소</button>
                                        <button type="submit" className="px-16 py-4 bg-gray-900 text-white rounded-[24px] font-black shadow-2xl hover:bg-black transition-all flex items-center gap-2">
                                            <Save className="w-5 h-5" /> 변경 사항 저장
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Modal Sidebar: Recent Activity or History could go here */}
                            <div className="w-72 bg-gray-50/50 border-l border-gray-50 p-8 flex flex-col gap-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> 최근 변경 내역
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="text-[9px] font-black text-blue-500 mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> STATUS UPDATED
                                        </div>
                                        <div className="text-xs font-bold text-gray-900">상태가 <span className="text-blue-600">[{formData.status}]</span>로 변경되었습니다.</div>
                                        <div className="text-[8px] text-gray-300 mt-2 font-bold">{new Date(formData.updatedAt || 0).toLocaleString()}</div>
                                    </div>
                                    {formData._creationTime && (
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="text-[9px] font-black text-gray-400 mb-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> RECORD CREATED
                                            </div>
                                            <div className="text-xs font-bold text-gray-900">계약 레코드가 생성되었습니다.</div>
                                            <div className="text-[8px] text-gray-300 mt-2 font-bold">{new Date(formData._creationTime).toLocaleString()}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
