"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NewsFeed from "./NewsFeed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    return (
        <div className="flex h-screen bg-background overflow-hidden text-sm">
            {/* Left Sidebar */}
            <div
                className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${leftOpen ? "w-64" : "w-0"} overflow-hidden`}
            >
                <Sidebar />
            </div>

            {/* Left collapse toggle */}
            <button
                onClick={() => setLeftOpen(o => !o)}
                className="relative z-20 flex-shrink-0 self-center -mx-3 w-6 h-12 flex items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-white hover:border-primary/50 transition-colors shadow-md"
                aria-label={leftOpen ? "Collapse left sidebar" : "Expand left sidebar"}
            >
                {leftOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar onToggleSidebar={() => setLeftOpen(o => !o)} />
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {children}
                    </div>
                </main>
            </div>

            {/* Right collapse toggle */}
            <button
                onClick={() => setRightOpen(o => !o)}
                className="relative z-20 flex-shrink-0 self-center -mx-3 w-6 h-12 flex items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-white hover:border-primary/50 transition-colors shadow-md"
                aria-label={rightOpen ? "Collapse right sidebar" : "Expand right sidebar"}
            >
                {rightOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {/* Right Sidebar (News / AI feed) */}
            <div
                className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${rightOpen ? "w-80" : "w-0"} overflow-hidden`}
            >
                <NewsFeed />
            </div>
        </div>
    );
}
