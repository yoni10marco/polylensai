"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            router.push(`/dashboard/markets?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="h-16 border-b border-border bg-surface/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
                {/* Sidebar toggle (mobile / collapsible) */}
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 rounded-md text-muted hover:text-white hover:bg-white/5 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
                <div className="relative w-80 md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background text-white placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Search markets or topics..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex text-xs text-muted gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block"></span> Global Vol: $45.2M</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> 24h Users: 12.4K</span>
                </div>
            </div>
        </header>
    );
}
