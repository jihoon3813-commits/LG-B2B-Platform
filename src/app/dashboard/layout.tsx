import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--bg-body)] flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 min-h-screen transition-all duration-300 p-4 md:p-8">
                <div className="container mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
