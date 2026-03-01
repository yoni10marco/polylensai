"use client";

import { useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchActiveMarketsAction } from "@/lib/actions";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TrendingUp, ArrowUpRight, BarChart2, Activity, Star } from "lucide-react";

const CATEGORIES = ["All", "Watchlist", "Crypto", "Politics", "Pop Culture", "Sports"];

function MarketsContent() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || "";
    const [selectedCategory, setSelectedCategory] = useState("All");
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch watchlist from Supabase
    const { data: watchlistIds = [] } = useQuery<string[]>({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data } = await supabase.from("watchlists").select("condition_id").eq("user_id", user.id);
            return (data || []).map((r: any) => r.condition_id as string);
        },
    });

    // Optimistic star toggle
    const toggleMutation = useMutation({
        mutationFn: async ({ conditionId, title, starred }: { conditionId: string; title: string; starred: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (starred) {
                await supabase.from("watchlists").delete().eq("user_id", user.id).eq("condition_id", conditionId);
            } else {
                await supabase.from("watchlists").upsert({ user_id: user.id, condition_id: conditionId, market_title: title }, { onConflict: "user_id,condition_id" });
            }
        },
        onMutate: async ({ conditionId, starred }) => {
            await queryClient.cancelQueries({ queryKey: ['watchlist'] });
            const prev = queryClient.getQueryData<string[]>(['watchlist']) || [];
            queryClient.setQueryData<string[]>(['watchlist'],
                starred ? prev.filter(id => id !== conditionId) : [...prev, conditionId]
            );
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(['watchlist'], ctx.prev);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    const toggleWatchlist = (e: React.MouseEvent, conditionId: string, title: string) => {
        e.preventDefault();
        toggleMutation.mutate({ conditionId, title, starred: watchlistIds.includes(conditionId) });
    };

    const { data: markets, isLoading } = useQuery({
        queryKey: ['activeMarkets'],
        queryFn: () => fetchActiveMarketsAction(50),
        refetchInterval: 300000,
    });

    const filteredMarkets = markets?.filter((market: any) => {
        const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (selectedCategory === "Watchlist") {
            return matchesSearch && watchlistIds.includes(market.conditionId);
        }
        const matchesCategory = selectedCategory === "All" || market.category.toLowerCase().includes(selectedCategory.toLowerCase());
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col gap-6 h-full w-full max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-primary" />
                        Global Markets
                    </h1>
                    <p className="text-muted text-sm">Discover trending events and trade on information asymmetry.</p>
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                ? "bg-primary text-background shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                                : "bg-surface border border-border text-muted hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {searchQuery && (
                <div className="text-sm text-primary mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg inline-block self-start">
                    Showing results for: <span className="font-bold">"{searchQuery}"</span>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    // Skeleton Loaders
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-panel p-6 animate-pulse flex flex-col min-h-[220px]">
                            <div className="h-6 bg-white/5 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-white/5 rounded w-1/4 mb-8"></div>
                            <div className="mt-auto flex justify-between items-end">
                                <div className="h-10 bg-white/5 rounded w-16"></div>
                                <div className="h-6 bg-white/5 rounded w-24"></div>
                            </div>
                        </div>
                    ))
                ) : filteredMarkets && filteredMarkets.length > 0 ? (
                    filteredMarkets.map((market: any) => (
                        <Link href={`/dashboard/markets/${market.conditionId}`} key={market.id} className="group glass-panel p-6 flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden min-h-[220px]">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-4 gap-4">
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                    {market?.title}
                                </h3>
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={(e) => toggleWatchlist(e, market.conditionId, market.title)}
                                        className="text-muted hover:text-yellow-400 transition-colors z-10"
                                    >
                                        <Star className={`w-5 h-5 transition-all ${watchlistIds.includes(market.conditionId) ? 'fill-yellow-400 text-yellow-400 scale-110' : ''}`} />
                                    </button>
                                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${market.sentiment === 'Positive' ? 'bg-positive/20 text-positive' :
                                        market.sentiment === 'Negative' ? 'bg-negative/20 text-negative' :
                                            'bg-white/10 text-muted'
                                        }`}>
                                        <Activity className="w-3 h-3" />
                                        {market.sentiment}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-auto">
                                {market?.category}
                            </div>

                            <div className="mt-6 flex justify-between items-end border-t border-border/50 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted mb-1">PROBABILITY</span>
                                    {market?.probability === "N/A" ? (
                                        <div className="bg-white/10 text-muted px-2 py-1 rounded-sm text-sm font-bold inline-block self-start mt-1">N/A</div>
                                    ) : (
                                        <div className={`flex items-center gap-1 font-extrabold px-2 py-1 rounded-sm text-xl mt-1 self-start ${parseFloat(market?.probability) > 50 ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
                                            {market?.probability}%
                                            {parseFloat(market?.probability) > 50 ? <ArrowUpRight className="w-5 h-5 opacity-80" /> : null}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted mb-1 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> VOL</span>
                                    <span className="text-sm font-bold text-gray-300">{market?.volume || "$0"}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted border border-dashed border-border rounded-xl">
                        <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                        <p>No markets matched your specific criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MarketsPage() {
    return (
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-muted">Loading markets...</div>}>
            <MarketsContent />
        </Suspense>
    );
}
