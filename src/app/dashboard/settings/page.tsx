"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
    User,
    Key,
    Save,
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
        googleCx: "",
        aligoApiKey: "",
        aligoUserId: "",
        aligoSenderNumber: "",
        discordWebhookUrl: "",
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
                googleCx: systemSettings.googleCx || "",
                aligoApiKey: systemSettings.aligoApiKey || "",
                aligoUserId: systemSettings.aligoUserId || "",
                aligoSenderNumber: systemSettings.aligoSenderNumber || "",
                discordWebhookUrl: systemSettings.discordWebhookUrl || "",
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
                googleCx: form.googleCx || undefined,
                aligoApiKey: form.aligoApiKey || undefined,
                aligoUserId: form.aligoUserId || undefined,
                aligoSenderNumber: form.aligoSenderNumber || undefined,
                discordWebhookUrl: form.discordWebhookUrl || undefined,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-white)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)]">
                        <h2 className="text-lg font-bold flex items-center text-blue-500">
                            <Globe className="w-5 h-5 mr-2" />
                            Google Search (크롤러)
                        </h2>
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
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-white)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)]">
                        <h2 className="text-lg font-bold flex items-center text-indigo-500">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 0-1.872-.892.077.077 0 0 1-.041-.128c.125-.094.252-.192.37-.29a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.37.29a.077.077 0 0 1-.041.128 12.98 12.98 0 0 0-1.872.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.158-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.158-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                            Discord (웹훅 알림)
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Discord Webhook URL</label>
                            <input
                                type="text"
                                placeholder="https://discordapp.com/api/webhooks/..."
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary)]"
                                value={form.discordWebhookUrl}
                                onChange={(e) => setForm({ ...form, discordWebhookUrl: e.target.value })}
                            />
                        </div>
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
