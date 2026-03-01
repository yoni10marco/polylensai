"use client";

import { BarChart2, BellRing, BookOpen, Compass, LayoutDashboard, LogOut, Settings, User, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Global Markets", href: "/dashboard/markets", icon: Compass },
    { name: "Watchlist", href: "/dashboard/watchlist", icon: Star },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
    { name: "Alerts", href: "/dashboard/alerts", icon: BellRing },
    { name: "Data Guide", href: "/dashboard/guide", icon: BookOpen },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [tier, setTier] = useState<string>("free");
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            const user = data.user;
            if (!user) return;
            setUserEmail(user.email ?? null);
            const { data: profile } = await supabase
                .from("profiles").select("tier").eq("id", user.id).single();
            setTier(profile?.tier ?? "free");
        });
    }, []);

    async function handleSignOut() {
        setSigningOut(true);
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

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
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
                {/* User info */}
                {userEmail && (
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg bg-white/5 border border-border">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{userEmail}</p>
                            {tier === "pro" ? (
                                <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                                    ⚡ Pro Plan
                                </span>
                            ) : (
                                <p className="text-muted text-[10px]">Free plan</p>
                            )}
                        </div>
                    </div>
                )}

                <Link href="/" className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors">
                    Back to Website
                </Link>
                <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-muted hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                    <LogOut className="w-5 h-5" />
                    {signingOut ? "Signing out…" : "Sign Out"}
                </button>
            </div>
        </aside>
    );
}
