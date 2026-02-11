"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
    User,
    Key,
    Save,
    Bell,
    Loader2,
    Globe
} from "lucide-react";

export default function SettingsPage() {
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    useEffect(() => {
        setCurrentUserEmail(localStorage.getItem("user_email"));
    }, []);

    // 사용자 정보 및 시스템 설정 불러오기
    const myProfile: any = useQuery(api.users.getMe,
        currentUserEmail ? { email: currentUserEmail } : "skip"
    );

    const systemSettings: any = useQuery(api.settings.getSettings);

    const updateProfile = useMutation(api.users.updateProfile);
    const updateSettings = useMutation(api.settings.updateSettings);

    const [form, setForm] = useState({
        name: "",
        newPassword: "",
        googleApiKey: "",
        googleCx: ""
    });

    const [isSaving, setIsSaving] = useState(false);

    // 데이터 로드 시 폼 초기화
    useEffect(() => {
        if (myProfile) {
            setForm(prev => ({ ...prev, name: myProfile.name }));
        }
    }, [myProfile]);

    useEffect(() => {
        if (systemSettings) {
            setForm(prev => ({
                ...prev,
                googleApiKey: systemSettings.googleApiKey || "",
                googleCx: systemSettings.googleCx || ""
            }));
        }
    }, [systemSettings]);

    const handleSave = async () => {
        if (!myProfile) return;

        setIsSaving(true);
        try {
            // 1. 프로필 업데이트
            await updateProfile({
                id: myProfile._id,
                name: form.name,
                password: form.newPassword || undefined
            });

            // 2. 시스템 설정 업데이트 (Google API Key 등)
            await updateSettings({
                googleApiKey: form.googleApiKey || undefined,
                googleCx: form.googleCx || undefined
            });

            alert("설정이 성공적으로 저장되었습니다!");
            setForm(prev => ({ ...prev, newPassword: "" }));
        } catch (err) {
            console.error(err);
            alert("설정 저장에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUserEmail) {
        return <div className="p-8 text-center text-gray-500">인증 정보를 확인 중입니다...</div>;
    }

    if (myProfile === undefined) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">시스템 설정</h1>
                <p className="text-[var(--text-sub)]">계정 정보 및 플랫폼 환경 설정을 관리합니다.</p>
            </div>

            {/* Profile Settings */}
            <div className="bg-[var(--bg-white)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold flex items-center">
                        <User className="w-5 h-5 mr-2 text-[var(--primary)]" />
                        관리자 프로필
                    </h2>
                    <p className="text-sm text-[var(--text-sub)]">개인 정보를 업데이트합니다.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">이름</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary)]"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">이메일 주소</label>
                            <input
                                type="email"
                                value={myProfile.email}
                                className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                                disabled
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">새 비밀번호</label>
                        <div className="flex items-center">
                            <Key className="w-4 h-4 text-gray-400 mr-2" />
                            <input
                                type="password"
                                placeholder="비밀번호를 변경하려면 입력하세요"
                                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary)]"
                                value={form.newPassword}
                                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* External API Settings (Google Search) */}
            <div className="bg-[var(--bg-white)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-blue-500" />
                        외부 API 연동 (크롤러 정확도 향상)
                    </h2>
                    <p className="text-sm text-[var(--text-sub)]">Google Custom Search API 정보를 입력하면 제품 정보 수집의 정확도가 높아집니다.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Google API Key</label>
                        <input
                            type="password"
                            placeholder="AIzaSy..."
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary)]"
                            value={form.googleApiKey}
                            onChange={(e) => setForm({ ...form, googleApiKey: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Google Cloud Platform에서 발급받은 API 키를 입력하세요.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Search Engine ID (CX)</label>
                        <input
                            type="text"
                            placeholder="0123456789..."
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary)]"
                            value={form.googleCx}
                            onChange={(e) => setForm({ ...form, googleCx: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Programmable Search Engine ID를 입력하세요.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    className="btn btn-primary px-8 py-3 shadow-lg flex items-center"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    변경 사항 저장
                </button>
            </div>
        </div>
    );
}
