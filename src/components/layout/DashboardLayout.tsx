"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NewsFeed from "./NewsFeed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-background overflow-hidden text-sm">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {children}
                    </div>
                </main>
            </div>
            <NewsFeed />
        </div>
    );
}
