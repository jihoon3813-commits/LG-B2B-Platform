"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Plus, Trash2, Edit, ExternalLink, Smartphone, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";

interface Campaign {
    _id: Id<"campaigns">;
    _creationTime: number;
    title: string;
    status: string;
    thumbnailUrl?: string;
    viewCount?: number;
}

export default function CampaignListPage() {
    const campaigns = useQuery(api.campaigns.list);
    const createCampaign = useMutation(api.campaigns.create);
    const deleteCampaign = useMutation(api.campaigns.remove);
    const router = useRouter();

    const handleCreate = async () => {
        const title = prompt("새 캠페인 제목을 입력하세요:");
        if (!title) return;

        const id = await createCampaign({
            title,
            blocks: [],
            status: "draft",
        });
        router.push(`/dashboard/campaigns/editor/${id}`);
    };

    const handleDelete = async (id: Id<"campaigns">) => {
        if (confirm("정말로 삭제하시겠습니까?")) {
            await deleteCampaign({ id });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">캠페인 관리</h1>
                    <p className="text-gray-500">모바일 전용 랜딩 페이지를 제작하고 관리합니다.</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    새 캠페인 만들기
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(campaigns as Campaign[] | undefined)?.map((campaign) => (
                    <div
                        key={campaign._id}
                        className="bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full cursor-pointer"
                        onClick={() => router.push(`/dashboard/campaigns/editor/${campaign._id}`)}
                    >
                        {/* Preview Area */}
                        <div className="aspect-[9/16] bg-gray-50 flex items-center justify-center relative overflow-hidden border-b border-gray-50">
                            {campaign.thumbnailUrl ? (
                                <img src={campaign.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="text-gray-300 flex flex-col items-center">
                                    <Smartphone className="w-12 h-12 mb-3 opacity-20" />
                                    <span className="text-[10px] font-black tracking-widest uppercase opacity-40">No Preview</span>
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight shadow-sm ${campaign.status === "published"
                                    ? "bg-green-500 text-white"
                                    : "bg-white/90 backdrop-blur-md text-gray-600"
                                    }`}>
                                    {campaign.status === "published" ? "LIVE" : "DRAFT"}
                                </span>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                <div className="bg-white p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <Edit className="w-6 h-6 text-gray-900" />
                                </div>
                            </div>
                        </div>

                        {/* Info Area */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">{campaign.title}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(campaign._creationTime).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(campaign._id);
                                    }}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600">V</div>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400">View: {campaign.viewCount || 0}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/campaign/${campaign._id}`}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                    <div className="px-4 py-2 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl text-[10px] font-black transition-all">
                                        디자인 수정
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {campaigns?.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                        등록된 캠페인이 없습니다. 새로운 캠페인을 만들어보세요.
                    </div>
                )}
            </div>
        </div>
    );
}
