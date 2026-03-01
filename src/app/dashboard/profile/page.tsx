"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { User, Zap, Crown, BarChart2, Calendar } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const supabase = createClient();
    const [profile, setProfile] = useState<{ email: string; tier: string; created_at: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("profiles").select("tier, created_at").eq("id", user.id).single();
            setProfile({
                email: user.email ?? "—",
                tier: data?.tier ?? "free",
                created_at: data?.created_at ?? user.created_at,
            });
            setLoading(false);
        }
        load();
    }, []);

    const joined = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—";

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-2">
            <div>
                <h1 className="text-2xl font-bold text-white">Profile</h1>
                <p className="text-muted text-sm mt-1">Your account information and subscription details.</p>
            </div>

            {loading ? (
                <div className="glass-panel p-8 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Account Info */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Account</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                <User className="w-7 h-7 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-semibold text-base truncate">{profile?.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-3.5 h-3.5 text-muted" />
                                    <span className="text-muted text-xs">Member since {joined}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Subscription</h2>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {profile?.tier === "pro" ? (
                                    <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                                        <Crown className="w-5 h-5 text-yellow-400" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-border flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-muted" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-semibold capitalize">
                                        {profile?.tier === "pro" ? "⚡ Pro Plan" : "Free Plan"}
                                    </p>
                                    <p className="text-muted text-xs">
                                        {profile?.tier === "pro"
                                            ? "Unlimited AI messages, full market access"
                                            : "3 AI messages / day, limited access"}
                                    </p>
                                </div>
                            </div>
                            {profile?.tier !== "pro" && (
                                <Link
                                    href="/dashboard/settings"
                                    className="px-4 py-2 bg-primary text-background rounded-md font-semibold text-xs hover:bg-primary/90 transition-colors"
                                >
                                    Upgrade to Pro
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="glass-panel p-6">
                        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Activity</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
                                <BarChart2 className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-white text-sm font-semibold">Markets</p>
                                    <p className="text-muted text-xs">Explore markets to analyze</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <div>
                                    <p className="text-white text-sm font-semibold">
                                        {profile?.tier === "pro" ? "Unlimited" : "3 / day"}
                                    </p>
                                    <p className="text-muted text-xs">AI messages remaining</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
