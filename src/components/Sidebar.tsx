"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Megaphone,
    Users,
    FileText,
    Package,
    Settings,
    LogOut,
    Menu
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const menuItems = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "캠페인 관리", href: "/dashboard/campaigns", icon: Megaphone },
    { name: "고객 관리", href: "/dashboard/customers", icon: Users },
    { name: "계약 관리", href: "/dashboard/contracts", icon: FileText },
    { name: "제품 관리", href: "/dashboard/products", icon: Package },
    { name: "시스템 설정", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        const email = localStorage.getItem("user_email");
        if (email) setUserEmail(email);
    }, []);

    const user = useQuery(api.users.getMe, userEmail ? { email: userEmail } : "skip");

    const userRoleLabel = user?.role === "admin" ? "최고 관리자" : "운영자";
    const userName = user?.name || "관리자";

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 glass-panel bg-white/80"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-[var(--bg-white)] border-r border-[var(--border)] z-40 transition-transform duration-300 ease-in-out shadow-lg
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-20 flex items-center px-6 border-b border-[var(--border)]">
                        <h1 className="text-xl font-bold text-gradient">Life N Joy</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group
                    ${isActive
                                            ? "bg-[var(--primary)] text-white shadow-md shadow-red-500/20"
                                            : "text-[var(--text-sub)] hover:bg-[var(--bg-body)] hover:text-[var(--primary)]"}
                  `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-[var(--primary)]"}`} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-body)]/50">
                        <div className="flex items-center space-x-3 mb-4 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-pink-500 flex items-center justify-center text-white font-bold shadow-sm">
                                {userName.substring(0, 1)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold truncate">{userName}</p>
                                <p className="text-xs text-[var(--text-sub)] truncate">{userRoleLabel}</p>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--error)] hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">로그아웃</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden glass-panel backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
