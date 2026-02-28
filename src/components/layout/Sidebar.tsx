"use client";

import { BarChart3, BellRing, Compass, LayoutDashboard, Settings, User, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Global Markets", href: "/dashboard/markets", icon: Compass },
    { name: "Watchlist", href: "/dashboard/watchlist", icon: Star },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Alerts", href: "/dashboard/alerts", icon: BellRing },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-border bg-surface flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold text-primary tracking-wider flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_#00e5ff]"></div>
                    PolyLens AI
                </h1>
                <p className="text-[10px] text-muted uppercase tracking-widest mt-1 ml-5">Intelligence Suite</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-3">
                    Menu
                </div>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-1">
                <Link href="/" className="flex items-center justify-center gap-2 mb-4 w-full py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors">
                    Back to Website
                </Link>
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-muted hover:text-white hover:bg-white/5 transition-colors">
                    <User className="w-5 h-5" />
                    Profile
                </Link>
                <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-muted hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
            </div>
        </aside>
    );
}
