"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo } from "react";
import {
    Plus,
    Search,
    Filter,
    Trash2,
    UploadCloud,
    X,
    Check,
    Send,
    History,
    ChevronRight,
    ChevronLeft,
    User,
    Mail,
    Phone,
    Building2,
    Calendar,
    AlertCircle,
    Users,
    FolderPlus,
    Pencil
} from "lucide-react";
import * as XLSX from "xlsx";
import { Id } from "../../../../convex/_generated/dataModel";
import { DownloadCloud } from "lucide-react";

interface Customer {
    _id: Id<"customers">;
    _creationTime: number;
    name: string;
    phoneNumber: string;
    company?: string;
    email?: string;
    groupId?: Id<"groups">;
    status: string;
    memo?: string;
    lastCampaignName?: string;
    lastSentDate?: number;
}

interface CustomerFormData {
    name: string;
    company: string;
    email: string;
    phoneNumber: string;
    groupId?: Id<"groups">;
    status: string;
    memo: string;
}

interface Campaign {
    _id: Id<"campaigns">;
    _creationTime: number;
    title: string;
    status: string;
    thumbnailUrl?: string;
}

interface CustomerGroup {
    _id: Id<"groups">;
    name: string;
    description?: string;
    color?: string;
}

const STATUS_OPTIONS = [
    "가망 고객",
    "캠페인 발송",
    "상담 등록",
    "관심 고객",
    "제외대상"
];

export default function CustomersPage() {
    const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | "all">("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const customers = useQuery(api.customers.list, {
        groupId: selectedGroupId === "all" ? undefined : selectedGroupId,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1 : undefined, // Include full day
    });
    const groups = useQuery(api.customerGroups.list);
    const campaigns = useQuery(api.campaigns.list, {});

    const createCustomer = useMutation(api.customers.create);
    const updateCustomer = useMutation(api.customers.update);
    const deleteCustomer = useMutation(api.customers.remove);
    const sendCampaign = useMutation(api.campaignHistory.send);
    const bulkMoveToGroup = useMutation(api.customers.bulkMoveToGroup);

    const createGroup = useMutation(api.customerGroups.create);
    const updateGroup = useMutation(api.customerGroups.update);
    const deleteGroup = useMutation(api.customerGroups.remove);
    const bulkRemoveCustomers = useMutation(api.customers.bulkRemove);

    const [isImporting, setIsImporting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Id<"customers">[]>([]);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isMoveGroupModalOpen, setIsMoveGroupModalOpen] = useState(false);

    // Form Data
    const [formData, setFormData] = useState<CustomerFormData>({
        name: "",
        company: "",
        email: "",
        phoneNumber: "",
        status: "가망 고객",
        memo: ""
    });
    const [groupName, setGroupName] = useState("");
    const [selectedGroupToEdit, setSelectedGroupToEdit] = useState<CustomerGroup | null>(null);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<Id<"campaigns"> | null>(null);

    // Fetch History for selected customer
    const customerHistory = useQuery(api.campaignHistory.getByCustomer,
        selectedCustomer ? { customerId: selectedCustomer._id } : "skip"
    ) as any[];

    // Searching logic (matching against what's returned from the list query)
    const filteredCustomers = useMemo(() => {
        if (!customers) return [];
        return (customers as Customer[]).filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.phoneNumber && c.phoneNumber.includes(searchTerm))
        );
    }, [customers, searchTerm]);

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`선택한 ${selectedIds.length}명의 고객 정보를 삭제하시겠습니까?`)) return;
        try {
            await bulkRemoveCustomers({ ids: selectedIds });
            setSelectedIds([]);
            alert("삭제되었습니다.");
        } catch (err) {
            console.error(err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredCustomers.slice(startIndex, startIndex + pageSize);
    }, [filteredCustomers, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredCustomers.length / pageSize);

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredCustomers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCustomers.map(c => c._id));
        }
    };

    const toggleSelect = (id: Id<"customers">) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            const raw = value.replace(/[^\d]/g, "");
            let formatted = raw;
            if (raw.length > 3 && raw.length <= 7) {
                formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
            } else if (raw.length > 7) {
                formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
            }
            setFormData(prev => ({ ...prev, [name]: formatted }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCustomer({ ...formData });
            setIsCreateModalOpen(false);
            setFormData({ name: "", company: "", email: "", phoneNumber: "", status: "가망 고객", memo: "" });
            alert("고객이 등록되었습니다.");
        } catch (err) {
            console.error(err);
            alert("등록 실패");
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        try {
            await updateCustomer({
                id: selectedCustomer._id,
                ...formData
            });
            setIsEditModalOpen(false);
            setSelectedCustomer(null);
            alert("수정되었습니다.");
        } catch (err) {
            console.error(err);
            alert("수정 실패");
        }
    };

    const openEditModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            company: customer.company || "",
            email: customer.email || "",
            phoneNumber: customer.phoneNumber,
            groupId: customer.groupId,
            status: customer.status,
            memo: customer.memo || ""
        });
        setIsEditModalOpen(true);
    };

    const handleGroupSubmit = async () => {
        if (!groupName) return;
        if (selectedGroupToEdit) {
            await updateGroup({ id: selectedGroupToEdit._id, name: groupName });
        } else {
            await createGroup({ name: groupName });
        }
        setGroupName("");
        setSelectedGroupToEdit(null);
        setIsGroupModalOpen(false);
    };

    const handleDeleteGroup = async (id: Id<"groups">) => {
        if (confirm("그룹을 삭제하시겠습니까? 그룹 내 고객들은 '그룹 없음'으로 변경됩니다.")) {
            await deleteGroup({ id });
            if (selectedGroupId === id) setSelectedGroupId("all");
        }
    };

    const handleSendCampaignSubmit = async () => {
        if (!selectedCampaignId) return;
        const campaign = (campaigns as Campaign[])?.find(c => c._id === selectedCampaignId);
        if (!campaign) return;
        try {
            await sendCampaign({
                customerIds: selectedIds,
                campaignId: selectedCampaignId,
                campaignTitle: campaign.title
            });
            alert("발송되었습니다.");
            setIsSendModalOpen(false);
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: Id<"customers">) => {
        if (confirm("정말로 이 고객 정보를 삭제하시겠습니까?")) {
            await deleteCustomer({ id });
            setIsEditModalOpen(false);
            setSelectedCustomer(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as Record<string, any>[];
                for (const row of rows) {
                    const name = row.name || row['이름'] || "이름없음";
                    const company = row.company || row['소속'] || row['회사명'];
                    const email = row.email || row['이메일'];
                    const rawPhone = row.phone || row['연락처'] || row['전화번호'] || "010-0000-0000";
                    const status = row.status || row['진행상태'] || "가망 고객";
                    const memo = row.notes || row['비고'] || row['메모'] || "";
                    const excelGroupName = row.group || row['그룹'];

                    // Match group name
                    let groupId = undefined;
                    if (excelGroupName && groups) {
                        const matchedGroup = groups.find(g => g.name === excelGroupName);
                        if (matchedGroup) {
                            groupId = matchedGroup._id;
                        }
                    }

                    // Normalize phone number
                    const raw = String(rawPhone).replace(/[^\d]/g, "");
                    let phone = raw;
                    if (raw.length === 11) {
                        phone = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
                    } else if (raw.length === 10) {
                        phone = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 10)}`;
                    }

                    await createCustomer({
                        name,
                        company,
                        email,
                        phoneNumber: phone,
                        status: STATUS_OPTIONS.includes(status) ? status : "가망 고객",
                        memo,
                        groupId
                    });
                }
                alert("가져오기 완료");
            } catch (err) { console.error(err); } finally { setIsImporting(false); }
        };
        reader.readAsBinaryString(file);
    };

    const downloadExcelSample = () => {
        const data = [
            {
                "이름": "홍길동",
                "소속": "LG전자",
                "연락처": "010-1234-5678",
                "이메일": "hong@example.com",
                "그룹": "VIP고객",
                "진행상태": "가망 고객",
                "메모": "엑셀 등록 테스트용 샘플 데이터입니다."
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "고객등록샘플");
        XLSX.writeFile(workbook, "고객관리_등록_샘플.xlsx");
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in relative">
            {/* Sidebar: Groups */}
            <div className="w-64 flex flex-col gap-4 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> 고객 그룹</h2>
                    <button onClick={() => { setSelectedGroupToEdit(null); setGroupName(""); setIsGroupModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <FolderPlus className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-1">
                    <button
                        onClick={() => setSelectedGroupId("all")}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedGroupId === "all" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "hover:bg-gray-50 text-gray-600"}`}
                    >
                        전체 고객
                    </button>
                    {groups?.map((group) => (
                        <div key={group._id} className="group flex items-center gap-1">
                            <button
                                onClick={() => setSelectedGroupId(group._id)}
                                className={`flex-1 text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex justify-between items-center ${selectedGroupId === group._id ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "hover:bg-gray-50 text-gray-600"}`}
                            >
                                <span className="truncate">{group.name}</span>
                            </button>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 pr-1">
                                <button onClick={() => { setSelectedGroupToEdit(group as CustomerGroup); setGroupName(group.name); setIsGroupModalOpen(true); }} className="p-1 hover:text-blue-600 text-gray-400"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteGroup(group._id)} className="p-1 hover:text-red-600 text-gray-400"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">상태별 필터</h2>
                    <div className="space-y-1">
                        <button onClick={() => setSelectedStatus("all")} className={`w-full text-left px-4 py-2 rounded-xl text-xs font-semibold ${selectedStatus === "all" ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}>전체 상태</button>
                        {STATUS_OPTIONS.map(status => (
                            <button key={status} onClick={() => setSelectedStatus(status)} className={`w-full text-left px-4 py-2 rounded-xl text-xs font-semibold ${selectedStatus === status ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:bg-gray-50"}`}>{status}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content: Customer Table */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Selection Bar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-2xl shadow-2xl z-40 flex items-center gap-6 animate-bounce-in">
                        <span className="text-sm font-medium"><span className="text-blue-400 font-bold">{selectedIds.length}</span>명 선택됨</span>
                        <div className="w-[1px] h-4 bg-gray-700"></div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsSendModalOpen(true)} className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg transition-all font-bold">
                                <Send className="w-4 h-4" /> 캠페인 발송
                            </button>
                            <button onClick={() => setIsMoveGroupModalOpen(true)} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded-lg transition-all font-bold">
                                <Users className="w-4 h-4" /> 그룹 이동
                            </button>
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg transition-all font-bold">
                                <Trash2 className="w-4 h-4" /> 삭제
                            </button>
                        </div>
                        <button onClick={() => setSelectedIds([])} className="text-sm text-gray-400 hover:text-white">취소</button>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {selectedGroupId === "all" ? "전체 고객 관리" : groups?.find(g => g._id === selectedGroupId)?.name}
                            <span className="text-sm font-normal text-gray-400">({filteredCustomers.length})</span>
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadExcelSample} className="btn border-gray-100 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm">
                            <DownloadCloud className="w-4 h-4 mr-2 text-blue-400" />
                            샘플 양식
                        </button>
                        <label className={`btn btn-secondary cursor-pointer border-gray-200 ${isImporting ? "opacity-50" : ""}`}>
                            <UploadCloud className="w-4 h-4 mr-2 text-gray-400" />
                            {isImporting ? "업로드 중..." : "엑셀 등록"}
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                        </label>
                        <button className="btn btn-primary shadow-lg shadow-blue-100" onClick={() => {
                            setFormData({ name: "", company: "", email: "", phoneNumber: "", status: "가망 고객", memo: "", groupId: selectedGroupId === "all" ? undefined : selectedGroupId });
                            setIsCreateModalOpen(true);
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> 고객 등록
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="이름, 회사, 전화번호 검색..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-50 outline-none transition-all text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input type="date" className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
                        <span className="text-gray-300">~</span>
                        <input type="date" className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
                        <option value={20}>20개씩 보기</option>
                        <option value={50}>50개씩 보기</option>
                        <option value={100}>100개씩 보기</option>
                    </select>
                </div>

                <div className="flex-1 bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                    <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-gray-300 text-blue-600 w-4 h-4 cursor-pointer" checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length} onChange={toggleSelectAll} /></th>
                                    <th className="px-6 py-4">고객 정보</th>
                                    <th className="px-6 py-4">연락처 / 그룹</th>
                                    <th className="px-6 py-4">최근 행위</th>
                                    <th className="px-6 py-4">상태</th>
                                    <th className="px-6 py-4 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCustomers.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-32 text-center text-gray-300 italic text-sm">해당 조건의 고객이 없습니다.</td></tr>
                                ) : (
                                    paginatedCustomers.map((customer) => (
                                        <tr key={customer._id} className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${selectedIds.includes(customer._id) ? "bg-blue-50/50" : ""}`} onClick={() => openEditModal(customer)}>
                                            <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300 text-blue-600 w-4 h-4 cursor-pointer" checked={selectedIds.includes(customer._id)} onChange={() => toggleSelect(customer._id)} /></td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 text-gray-500 flex items-center justify-center font-bold text-sm shadow-sm">{customer.name.slice(0, 1)}</div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{customer.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium">{customer.company || "소속 없음"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-[11px] text-gray-600 font-medium mb-1">{customer.phoneNumber}</div>
                                                <div className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                                                    {groups?.find(g => g._id === customer.groupId)?.name || "그룹 없음"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {customer.lastCampaignName ? (
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{customer.lastCampaignName}</div>
                                                        <div className="text-[9px] text-gray-400">{new Date(customer.lastSentDate || 0).toLocaleDateString()}</div>
                                                    </div>
                                                ) : <span className="text-gray-200">-</span>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight ${customer.status === '상담 등록' ? 'bg-indigo-100 text-indigo-700' :
                                                    customer.status === '가망 고객' ? 'bg-blue-100 text-blue-700' :
                                                        customer.status === '관심 고객' ? 'bg-green-100 text-green-700' :
                                                            customer.status === '제외대상' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {customer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}><button onClick={() => openEditModal(customer)} className="text-gray-300 hover:text-blue-600 p-2 hover:bg-white rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredCustomers.length > 0 && (
                        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                            <div className="text-xs text-gray-400 font-bold">
                                전체 <span className="text-blue-600">{filteredCustomers.length}</span>명 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredCustomers.length)} 표시
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
            </div>

            {/* Create/Edit Modal */}
            {(isCreateModalOpen || (isEditModalOpen && selectedCustomer)) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    {isCreateModalOpen ? <Plus className="w-6 h-6 text-blue-600" /> : <User className="w-6 h-6 text-indigo-600" />}
                                    {isCreateModalOpen ? "신규 고객 등록" : "고객 정보 관리"}
                                </h2>
                            </div>
                            <button onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} className="text-gray-300 hover:text-gray-900 border border-gray-100 p-2 rounded-2xl bg-white shadow-sm transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-hidden flex">
                            <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleUpdateSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">고객 성함 *</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">회사 / 소속</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input name="company" value={formData.company} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">연락처 *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">이메일</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">그룹 지정</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                            <select name="groupId" value={formData.groupId || ""} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium appearance-none">
                                                <option value="">그룹 없음</option>
                                                {groups?.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">진행 상태</label>
                                        <div className="relative">
                                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3.5 border border-blue-100 rounded-2xl bg-blue-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-blue-700 appearance-none">
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">상담/관리 메모</label>
                                    <textarea name="memo" value={formData.memo} onChange={handleInputChange} className="w-full p-6 border border-gray-100 rounded-3xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none h-40 resize-none transition-all font-medium" />
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                    {isEditModalOpen && selectedCustomer && (
                                        <button type="button" onClick={() => handleDelete(selectedCustomer._id)} className="px-6 py-3.5 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm flex items-center gap-2 flex-shrink-0"><Trash2 className="w-4 h-4" /> 정보 삭제</button>
                                    )}
                                    <div className="flex gap-4 flex-1 justify-end">
                                        <button type="button" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} className="px-8 py-3.5 text-gray-400 hover:text-gray-900 font-bold">취소</button>
                                        <button type="submit" className="px-12 py-3.5 bg-gray-900 text-white rounded-2xl hover:bg-black shadow-xl transition-all font-black">
                                            {isCreateModalOpen ? "고객 등록 완료" : "업데이트 완료"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                            {isEditModalOpen && (
                                <div className="w-[320px] bg-gray-50/50 border-l border-gray-50 p-10 flex flex-col gap-8">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><History className="w-4 h-4" /> 캠페인 발송 타임라인</h3>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {!customerHistory || customerHistory.length === 0 ? (
                                                <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center"><p className="text-[10px] text-gray-300 font-bold italic">발송 이력이 없습니다.</p></div>
                                            ) : (
                                                customerHistory.map((h: any) => (
                                                    <div key={h._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                                                        <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-20" />
                                                        <div className="text-xs font-black text-gray-900 leading-tight mb-2">{h.campaignTitle}</div>
                                                        <div className="text-[9px] text-gray-400 flex items-center gap-1 font-bold"><Calendar className="w-3 h-3 text-blue-400" /> {new Date(h.sentAt).toLocaleDateString()}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    {formData.status === "상담 등록" && (
                                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[24px] text-white shadow-lg shadow-indigo-100 animate-pulse-slow">
                                            <div className="text-[10px] font-black opacity-60 uppercase mb-2">Notice</div>
                                            <div className="text-sm font-black leading-snug">이 고객은 현재<br />상담/계약 관리 대상입니다.</div>
                                            <button onClick={() => window.location.href = '/dashboard/contracts'} className="mt-4 w-full bg-white/20 hover:bg-white/30 py-2 rounded-xl text-[10px] font-black flex justify-center items-center gap-1 transition-all">이동하기 <ChevronRight className="w-3 h-3" /></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Group Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black flex items-center gap-3"><FolderPlus className="w-5 h-5 text-blue-600" /> 그룹 {selectedGroupToEdit ? "수정" : "생성"}</h2>
                            <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-300 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">그룹 이름</label>
                                <input autoFocus value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold" placeholder="그룹명을 입력하세요" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsGroupModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-900">취소</button>
                            <button onClick={handleGroupSubmit} className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all">저장 완료</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move to Group Modal */}
            {isMoveGroupModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black flex items-center gap-3"><Users className="w-5 h-5 text-blue-600" /> 그룹 이동</h2>
                            <button onClick={() => setIsMoveGroupModalOpen(false)} className="text-gray-300 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">선택한 {selectedIds.length}명의 고객을 이동할 그룹을 선택하세요.</p>
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <button
                                onClick={async () => {
                                    await bulkMoveToGroup({ ids: selectedIds, groupId: undefined });
                                    setIsMoveGroupModalOpen(false);
                                    setSelectedIds([]);
                                    alert("이동되었습니다.");
                                }}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold flex justify-between items-center group transition-all"
                            >
                                그룹 없음 <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-all" />
                            </button>
                            {groups?.map(group => (
                                <button
                                    key={group._id}
                                    onClick={async () => {
                                        await bulkMoveToGroup({ ids: selectedIds, groupId: group._id });
                                        setIsMoveGroupModalOpen(false);
                                        setSelectedIds([]);
                                        alert("이동되었습니다.");
                                    }}
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-bold flex justify-between items-center group transition-all"
                                >
                                    {group.name} <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-all" />
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsMoveGroupModalOpen(false)} className="w-full py-4 text-gray-400 font-bold hover:text-gray-900">닫기</button>
                    </div>
                </div>
            )}

            {/* Campaign Send Modal - Inherited from previous state but consolidated */}
            {isSendModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl flex flex-col p-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900"><Send className="w-6 h-6 text-blue-600" /> 캠페인 발송</h2>
                                <p className="text-xs text-gray-400 mt-1 font-bold"><span className="text-blue-600">{selectedIds.length}명</span>의 타겟에게 전송됩니다.</p>
                            </div>
                            <button onClick={() => setIsSendModalOpen(false)} className="text-gray-300 hover:text-gray-900 border p-2 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4 flex-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {!campaigns || (campaigns as Campaign[]).filter(c => c.status === 'published').length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-3">
                                    <AlertCircle className="w-10 h-10 text-gray-200" />
                                    <p className="text-xs text-gray-400 font-bold">발송 가능한 발행 캠페인이 없습니다.</p>
                                </div>
                            ) : (
                                (campaigns as Campaign[]).filter(c => c.status === 'published').map((campaign) => (
                                    <div key={campaign._id} onClick={() => setSelectedCampaignId(campaign._id)} className={`p-4 border-2 rounded-[24px] cursor-pointer transition-all flex items-center gap-4 ${selectedCampaignId === campaign._id ? "border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-50" : "border-gray-50 hover:border-gray-100 bg-white"}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedCampaignId === campaign._id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-300"}`}><Calendar className="w-6 h-6" /></div>
                                        <div className="flex-1">
                                            <div className="font-black text-gray-900 text-sm leading-tight">{campaign.title}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-bold">Update: {new Date(campaign._creationTime).toLocaleDateString()}</div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCampaignId === campaign._id ? "border-blue-600 bg-blue-600" : "border-gray-100 bg-white"}`}>{selectedCampaignId === campaign._id && <Check className="w-4 h-4 text-white" />}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={handleSendCampaignSubmit} disabled={!selectedCampaignId} className="w-full py-5 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 font-black shadow-xl shadow-blue-100 disabled:opacity-20 transition-all flex items-center justify-center gap-3 text-lg"><Send className="w-5 h-5" /> 캠페인 전송 시작</button>
                    </div>
                </div>
            )}
        </div>
    );
}
