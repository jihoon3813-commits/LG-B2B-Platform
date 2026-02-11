"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo } from "react";
import {
    Plus, Search, Filter, Pencil, Trash2, FileDown, UploadCloud, X, Loader2, Sparkles, AlertCircle, ImageIcon, Download, ChevronLeft, ChevronRight, CheckSquare, Square
} from "lucide-react";
import * as XLSX from "xlsx";

interface ProductFormState {
    name: string;
    modelName: string;
    category: "one-time" | "subscription";
    subCategory: string;

    price: number;
    discountPrice: number;

    subscriptionPrice60: number;
    subscriptionDiscountPrice60: number;
    subscriptionPrice72: number;
    subscriptionDiscountPrice72: number;

    thumbnailUrl: string;
    detailImageUrl: string;
}

const PRODUCT_TYPES = [
    "TV", "냉장고", "김치냉장고", "세탁기", "건조기", "스타일러",
    "안마의자", "에어컨", "에어케어", "청소기", "쿠킹", "IT", "정수기", "기타"
];

export default function ProductsPage() {
    const products = useQuery(api.products.list, {});
    const settings: any = useQuery(api.settings.getSettings);

    const createProduct = useMutation(api.products.create);
    const updateProduct = useMutation(api.products.update);
    const deleteProduct = useMutation(api.products.remove);
    const removeManyProducts = useMutation(api.products.removeMany); // 일괄 삭제
    const fetchProductInfo = useAction(api.crawler.fetchProductInfo);

    // Filter States
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTypeTab, setActiveTypeTab] = useState("all");
    const [purchaseType, setPurchaseType] = useState<"all" | "one-time" | "subscription">("all");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Selection States
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<any>(null);
    const [isCrawling, setIsCrawling] = useState(false);

    const [newProduct, setNewProduct] = useState<ProductFormState>({
        name: "", modelName: "", category: "one-time", subCategory: "TV",
        price: 0, discountPrice: 0,
        subscriptionPrice60: 0, subscriptionDiscountPrice60: 0,
        subscriptionPrice72: 0, subscriptionDiscountPrice72: 0,
        thumbnailUrl: "", detailImageUrl: ""
    });

    const formatNum = (num: number) => num ? num.toLocaleString() : "";
    const handleChangePrice = (key: keyof ProductFormState, value: string) => {
        const numValue = Number(value.replace(/,/g, ""));
        if (!isNaN(numValue)) {
            setNewProduct(prev => ({ ...prev, [key]: numValue }));
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setNewProduct({
            name: "", modelName: "", category: "one-time", subCategory: "TV",
            price: 0, discountPrice: 0,
            subscriptionPrice60: 0, subscriptionDiscountPrice60: 0,
            subscriptionPrice72: 0, subscriptionDiscountPrice72: 0,
            thumbnailUrl: "", detailImageUrl: ""
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product: any) => {
        setIsEditing(true);
        setEditingId(product._id);
        setNewProduct({
            name: product.name,
            modelName: product.modelName,
            category: product.category as "one-time" | "subscription",
            subCategory: product.subCategory || "기타",
            price: product.price || 0,
            discountPrice: product.discountPrice || 0,
            subscriptionPrice60: product.subscriptionPrice60 || 0,
            subscriptionDiscountPrice60: product.subscriptionDiscountPrice60 || 0,
            subscriptionPrice72: product.subscriptionPrice72 || 0,
            subscriptionDiscountPrice72: product.subscriptionDiscountPrice72 || 0,
            thumbnailUrl: product.thumbnailUrl || "",
            detailImageUrl: product.detailImageUrl || "",
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!newProduct.name || !newProduct.modelName) {
            alert("제품명과 모델명은 필수입니다.");
            return;
        }
        try {
            if (isEditing && editingId) {
                await updateProduct({
                    id: editingId,
                    ...newProduct,
                    specs: {},
                });
                alert("제품 정보가 수정되었습니다.");
            } else {
                await createProduct({
                    ...newProduct,
                    isAutoFetched: false,
                    specs: {},
                    stock: 0,
                });
                alert("제품이 성공적으로 등록되었습니다.");
            }
            setIsModalOpen(false);
        } catch (e: any) {
            console.error(e);
            alert(`저장 실패: ${e.message}`);
        }
    };

    const handleCrawler = async () => {
        if (!newProduct.modelName) {
            alert("모델명을 먼저 입력해주세요.");
            return;
        }
        setIsCrawling(true);
        try {
            const info: any = await fetchProductInfo({
                modelName: newProduct.modelName,
                googleApiKey: settings?.googleApiKey,
                googleCx: settings?.googleCx
            });

            if (info && !info.error && info.name) {
                setNewProduct(prev => ({
                    ...prev,
                    name: info.name,
                    price: info.price || prev.price,
                    thumbnailUrl: info.thumbnailUrl || prev.thumbnailUrl,
                    detailImageUrl: info.detailImageUrl || prev.detailImageUrl
                }));
                alert(`정보를 성공적으로 가져왔습니다!`);
            } else {
                alert("정보를 찾을 수 없습니다.");
            }
        } catch (e: any) {
            console.error(e);
            alert(`에러: ${e.message}`);
        } finally {
            setIsCrawling(false);
        }
    };

    const handleDownloadSample = () => {
        const ws = XLSX.utils.json_to_sheet([
            { "모델명": "S5MB", "카테고리": "one-time", "품목": "스타일러", "소비자가": 1500000, "할인가": 1350000 },
            { "모델명": "GFT4H", "카테고리": "subscription", "품목": "세탁기", "60개월정상가": 45000, "60개월할인가": 39000, "72개월정상가": 40000, "72개월할인가": 35000 }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sample");
        XLSX.writeFile(wb, "product_sample.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        setImportProgress("파일 분석 중...");
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);
                let successCount = 0; let failCount = 0;
                for (let i = 0; i < data.length; i++) {
                    const row: any = data[i];
                    const modelName = row['모델명'] || row.modelName;
                    // 제품명은 엑셀에 없으므로 모델명을 임시로 사용
                    const tempName = String(modelName);

                    if (!modelName) continue;
                    setImportProgress(`${i + 1}/${data.length} 처리 중... (${modelName})`);
                    try {
                        const productId = await createProduct({
                            modelName: String(modelName), name: tempName,
                            category: (row['카테고리'] === 'subscription' || row.category === 'subscription') ? 'subscription' : 'one-time',
                            subCategory: String(row['품목'] || row['subCategory'] || '기타'),
                            price: Number(row['소비자가'] || row.price || 0), discountPrice: Number(row['할인가'] || row.discountPrice || 0),
                            subscriptionPrice60: Number(row['60개월정상가'] || row.subscriptionPrice60 || 0), subscriptionDiscountPrice60: Number(row['60개월할인가'] || row.subscriptionDiscountPrice60 || 0),
                            subscriptionPrice72: Number(row['72개월정상가'] || row.subscriptionPrice72 || 0), subscriptionDiscountPrice72: Number(row['72개월할인가'] || row.subscriptionDiscountPrice72 || 0),
                            stock: 0, isAutoFetched: false, specs: {},
                        });

                        // Auto Crawling Hook
                        try {
                            const info: any = await fetchProductInfo({
                                modelName: String(modelName), googleApiKey: settings?.googleApiKey, googleCx: settings?.googleCx
                            });

                            if (info && !info.error) {
                                const updateData: any = { id: productId, isAutoFetched: true };
                                if (info.thumbnailUrl) {
                                    updateData.thumbnailUrl = info.thumbnailUrl;
                                    updateData.detailImageUrl = info.detailImageUrl || info.thumbnailUrl;
                                }
                                if (info.name) {
                                    let cleanedName = info.name;
                                    // 1. 모델명(대소문자 무시) 제거
                                    cleanedName = cleanedName.replace(new RegExp(String(modelName), "gi"), "").trim();
                                    // 2. 끝부분에 붙은 모델명 패턴(영문+숫자, 3글자 이상) 제거
                                    cleanedName = cleanedName.replace(/\s+[a-zA-Z0-9-]{3,}$/, "").trim();
                                    // 3. 괄호로 감싸진 상세 스펙 제거 (선택사항, 깔끔함을 위해)
                                    cleanedName = cleanedName.replace(/\s*\(.*?\)$/, "").trim();

                                    updateData.name = cleanedName;
                                }
                                await updateProduct(updateData);
                            }
                        } catch (cE) { console.warn(cE); }
                        successCount++;
                    } catch (e) { failCount++; }
                }
                alert(`완료! 성공: ${successCount}, 실패: ${failCount}`);
            } catch (e) { alert("오류 발생"); } finally { setIsImporting(false); setImportProgress(""); }
        };
        reader.readAsBinaryString(file);
        e.target.value = "";
    };

    // Filter & Pagination Logic
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.modelName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = activeTypeTab === "all" ? true : p.subCategory === activeTypeTab;
            const matchesPurchase = purchaseType === "all" ? true :
                purchaseType === "one-time" ? (p.category === "one-time" || !p.category) :
                    (p.category === "subscription");
            return matchesSearch && matchesType && matchesPurchase;
        });
    }, [products, searchTerm, activeTypeTab, purchaseType]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentData = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Selection Logic
    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === currentData.length && currentData.length > 0) {
            setSelectedIds(new Set()); // Deselect All
        } else {
            const newSet = new Set(currentData.map(p => p._id));
            setSelectedIds(newSet);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`선택한 ${selectedIds.size}개 제품을 정말 삭제하시겠습니까?`)) {
            try {
                await removeManyProducts({ ids: Array.from(selectedIds) as any });
                setSelectedIds(new Set());
                alert("삭제되었습니다.");
            } catch (e) {
                console.error(e);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleDelete = async (id: any) => {
        if (confirm("정말로 이 제품을 삭제하시겠습니까?")) await deleteProduct({ id });
    };

    // Check state helpers
    const isAllSelected = currentData.length > 0 && selectedIds.size === currentData.length;

    return (
        <div className="space-y-6 animate-fade-in-up relative pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">제품 관리</h1>
                    <p className="text-[var(--text-sub)]">등록된 B2B 제품 목록을 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary text-xs" onClick={handleDownloadSample}>
                        <Download className="w-4 h-4 mr-2" />
                        양식 다운로드
                    </button>
                    <label className={`btn btn-secondary cursor-pointer ${isImporting ? "opacity-50 pointer-events-none" : ""}`}>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        {isImporting ? importProgress : "일괄 등록(엑셀)"}
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
                    </label>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        제품 등록
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 bg-[var(--bg-white)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                    {/* 상세 품목 탭 */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
                        <button onClick={() => { setActiveTypeTab("all"); setCurrentPage(1); }} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all border ${activeTypeTab === "all" ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>전체 품목</button>
                        {PRODUCT_TYPES.map(type => (
                            <button key={type} onClick={() => { setActiveTypeTab(type); setCurrentPage(1); }} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all border ${activeTypeTab === type ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>{type}</button>
                        ))}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <select className="p-2 border rounded-lg text-sm bg-white" value={purchaseType} onChange={(e) => { setPurchaseType(e.target.value as any); setCurrentPage(1); }}>
                            <option value="all">전체 유형</option>
                            <option value="one-time">일시불</option>
                            <option value="subscription">가전구독</option>
                        </select>
                        <div className="relative flex-1 md:w-60">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input type="text" placeholder="제품명 검색..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] outline-none text-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                        </div>
                    </div>
                </div>

                {/* Selection & Pagination Options */}
                <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-black" onClick={handleSelectAll}>
                            {isAllSelected ? <CheckSquare className="w-5 h-5 text-[var(--primary)]" /> : <Square className="w-5 h-5 text-gray-400" />}
                            전체 선택
                        </button>
                        {selectedIds.size > 0 && (
                            <button onClick={handleBulkDelete} className="text-sm text-red-600 font-bold hover:underline flex items-center gap-1">
                                <Trash2 className="w-4 h-4" />
                                선택 삭제 ({selectedIds.size})
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>페이지당 보기:</span>
                        <select className="p-1 border rounded bg-white text-gray-700" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={20}>20개</option>
                            <option value={50}>50개</option>
                            <option value={100}>100개</option>
                        </select>
                        <span className="ml-2">총 {filteredProducts.length}개 중 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products === undefined ? <div className="col-span-full text-center py-20 text-gray-500">데이터를 불러오는 중입니다...</div> :
                    currentData.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-[var(--bg-white)] rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 mb-4">조건에 맞는 제품이 없습니다.</p>
                        </div>
                    ) : (
                        currentData.map((product: any) => {
                            const isSelected = selectedIds.has(product._id);
                            return (
                                <div key={product._id}
                                    className={`bg-[var(--bg-white)] rounded-xl border overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full cursor-pointer ${isSelected ? "ring-2 ring-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)]"}`}
                                    onClick={(e) => {
                                        // 체크박스나 체크박스 영역 클릭 시 모달 안 열리게 처리
                                        if ((e.target as HTMLElement).closest('.checkbox-area')) return;
                                        openEditModal(product);
                                    }}
                                >
                                    <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center border-b p-6">

                                        {/* Checkbox Overlay */}
                                        <div className="absolute top-2 left-2 z-10 checkbox-area">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 부모 클릭 방지
                                                    handleToggleSelect(product._id);
                                                }}
                                                className="p-1 rounded bg-white/80 backdrop-blur hover:bg-white shadow-sm"
                                            >
                                                {isSelected ? <CheckSquare className="w-5 h-5 text-[var(--primary)] fill-white" /> : <Square className="w-5 h-5 text-gray-400" />}
                                            </button>
                                        </div>

                                        {product.thumbnailUrl ? <img src={product.thumbnailUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" /> : <div className="flex items-center justify-center h-full text-gray-400 text-sm">이미지 없음</div>}

                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 pointer-events-none">
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold ${product.category === 'subscription' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                                {product.category === 'subscription' ? "구독" : "일시불"}
                                            </span>
                                            {product.subCategory && <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border">{product.subCategory}</span>}
                                        </div>
                                    </div>

                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 mr-2">
                                                <h3 className="font-bold text-[var(--text-main)] text-sm leading-snug break-keep mb-1 group-hover:text-[var(--primary)] transition-colors">{product.name}</h3>
                                                <p className="text-[10px] text-[var(--text-sub)] font-mono">{product.modelName}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-[var(--border)]">
                                            {product.category === 'subscription' ? (
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-500">60개월</span>
                                                        <span className="font-bold text-[var(--primary)]">{product.subscriptionDiscountPrice60 ? product.subscriptionDiscountPrice60.toLocaleString() : "-"}원</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    {product.discountPrice > 0 ? (
                                                        <span className="text-sm font-bold text-[var(--primary)]">할인가 ₩ {product.discountPrice.toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-sm font-bold text-[var(--text-main)]">₩ {product.price.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                        .map(page => (
                            <button key={page} className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${currentPage === page ? "bg-black text-white" : "hover:bg-gray-100 text-gray-600"}`} onClick={() => handlePageChange(page)}>{page}</button>
                        ))}
                    <button className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}

            {/* Modal - 이전과 동일하여 생략된 부분 없이 포함됨 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in my-8">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">{isEditing ? "제품 정보 수정" : "새 제품 등록"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        </div>
                        {/* ... 모달 폼 내용 생략 없이 포함 ... */}
                        <div className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-gray-50 rounded border flex items-center justify-center overflow-hidden">
                                    {newProduct.thumbnailUrl ? <img src={newProduct.thumbnailUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-gray-300" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 p-2 border rounded-md text-sm" placeholder="모델명 예: S5MB" value={newProduct.modelName} onChange={(e) => setNewProduct({ ...newProduct, modelName: e.target.value })} />
                                        <button className="btn btn-secondary text-xs" onClick={handleCrawler} disabled={isCrawling}>{isCrawling ? <Loader2 className="w-3 h-3 animate-spin" /> : "검색"}</button>
                                    </div>
                                    <input type="text" className="w-full p-2 border rounded-md text-sm" placeholder="제품명" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">구매 유형</label>
                                    <select className="w-full p-2 text-sm border rounded bg-white" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}>
                                        <option value="one-time">일시불 (구매)</option>
                                        <option value="subscription">가전구독 (렌탈)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">상세 품목</label>
                                    <select className="w-full p-2 text-sm border rounded bg-white" value={newProduct.subCategory} onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}>
                                        {PRODUCT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3 border">
                                {newProduct.category === 'one-time' ? (
                                    <>
                                        <div><label className="block text-xs font-medium mb-1">소비자가 (정상가)</label><input type="text" className="w-full p-2 border rounded text-right" placeholder="0" value={formatNum(newProduct.price)} onChange={(e) => handleChangePrice("price", e.target.value)} /></div>
                                        <div><label className="block text-xs font-medium mb-1 text-blue-600">할인가 (최종 판매가)</label><input type="text" className="w-full p-2 border rounded text-right font-bold text-blue-600" placeholder="0" value={formatNum(newProduct.discountPrice)} onChange={(e) => handleChangePrice("discountPrice", e.target.value)} /></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4"><div className="col-span-2 text-xs font-bold text-gray-500 border-b pb-1">36/48/60개월 요금</div><div><label className="block text-[10px] text-gray-500 mb-1">60개월 정상가</label><input type="text" className="w-full p-2 border rounded text-right text-xs" value={formatNum(newProduct.subscriptionPrice60)} onChange={(e) => handleChangePrice("subscriptionPrice60", e.target.value)} /></div><div><label className="block text-[10px] text-purple-600 mb-1 font-bold">60개월 할인가</label><input type="text" className="w-full p-2 border rounded text-right text-xs font-bold text-purple-600" value={formatNum(newProduct.subscriptionDiscountPrice60)} onChange={(e) => handleChangePrice("subscriptionDiscountPrice60", e.target.value)} /></div></div>
                                        <div className="grid grid-cols-2 gap-4 mt-2"><div className="col-span-2 text-xs font-bold text-gray-500 border-b pb-1 mt-2">72개월 요금</div><div><label className="block text-[10px] text-gray-500 mb-1">72개월 정상가</label><input type="text" className="w-full p-2 border rounded text-right text-xs" value={formatNum(newProduct.subscriptionPrice72)} onChange={(e) => handleChangePrice("subscriptionPrice72", e.target.value)} /></div><div><label className="block text-[10px] text-purple-600 mb-1 font-bold">72개월 할인가</label><input type="text" className="w-full p-2 border rounded text-right text-xs font-bold text-purple-600" value={formatNum(newProduct.subscriptionDiscountPrice72)} onChange={(e) => handleChangePrice("subscriptionDiscountPrice72", e.target.value)} /></div></div>
                                    </>
                                )}
                            </div>
                            <div><label className="block text-xs font-medium mb-1">상세 이미지 URL</label><input type="text" className="w-full p-2 border rounded text-xs text-gray-400" placeholder="http://" value={newProduct.detailImageUrl} onChange={(e) => setNewProduct({ ...newProduct, detailImageUrl: e.target.value })} /></div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center gap-3">
                            {isEditing && (
                                <button className="btn text-red-500 hover:bg-red-50 px-3 py-2 text-sm border-none shadow-none" onClick={() => { handleDelete(editingId); setIsModalOpen(false); }}>
                                    <Trash2 className="w-4 h-4 inline-block mr-1" /> 삭제
                                </button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
                                <button className="btn btn-primary" onClick={handleSave}>{isEditing ? "수정완료" : "등록완료"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
