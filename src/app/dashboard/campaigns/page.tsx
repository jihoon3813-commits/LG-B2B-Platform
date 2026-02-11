"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Plus, Trash2, Edit, ExternalLink, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

    const handleDelete = async (id: any) => {
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
                {campaigns?.map((campaign: any) => (
                    <div key={campaign._id} className="bg-white rounded-xl border p-4 hover:shadow-lg transition-all flex flex-col">
                        <div className="aspect-[9/16] bg-gray-100 rounded-lg mb-4 flex items-center justify-center relative group overflow-hidden border">
                            {campaign.thumbnailUrl ? (
                                <img src={campaign.thumbnailUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <Smartphone className="w-8 h-8 mb-2" />
                                    <span className="text-xs">No Preview</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <Link href={`/campaign/${campaign._id}`} target="_blank" className="p-2 bg-white rounded-full hover:bg-gray-200"><ExternalLink className="w-4 h-4" /></Link>
                                <Link href={`/dashboard/campaigns/editor/${campaign._id}`} className="p-2 bg-white rounded-full hover:bg-gray-200"><Edit className="w-4 h-4" /></Link>
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{campaign.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${campaign.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                    {campaign.status === "published" ? "공개됨" : "작성 중"}
                                </span>
                            </div>
                            <button onClick={() => handleDelete(campaign._id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="mt-auto text-xs text-gray-400">
                            조회수: {campaign.viewCount || 0}
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
