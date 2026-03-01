"use client";

import { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchActiveMarketsAction } from "@/lib/actions";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TrendingUp, ArrowUpRight, BarChart2, Activity, Star, ChevronDown, Flame, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
    "All", "Watchlist",
    "Crypto", "Politics", "Sports", "Business",
    "Science", "Entertainment", "Weather", "Social Media", "Pop Culture",
];

const SORT_OPTIONS = [
    { value: "volume_desc", label: "Volume (High → Low)" },
    { value: "volume24h_desc", label: "24h Volume (High → Low)" },
    { value: "newest", label: "Newest First" },
    { value: "ending_soon", label: "Ending Soon" },
    { value: "prob_desc", label: "Most Certain (High %)" },
    { value: "prob_asc", label: "Most Volatile (Near 50%)" },
];

const PAGE_SIZE = 30;

function sortMarkets(markets: any[], sortKey: string) {
    return [...markets].sort((a, b) => {
        switch (sortKey) {
            case "volume_desc": return (b.volumeNum ?? 0) - (a.volumeNum ?? 0);
            case "volume24h_desc": return (b.volume24hrNum ?? 0) - (a.volume24hrNum ?? 0);
            case "newest": return new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime();
            case "ending_soon": return new Date(a.endDate ?? "9999").getTime() - new Date(b.endDate ?? "9999").getTime();
            case "prob_desc": return (b.probabilityNum ?? 0) - (a.probabilityNum ?? 0);
            case "prob_asc": return Math.abs(50 - (a.probabilityNum ?? 50)) - Math.abs(50 - (b.probabilityNum ?? 50));
            default: return 0;
        }
    });
}

function MarketsContent() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("q") || "";
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortKey, setSortKey] = useState("volume_desc");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [highVolatilityOnly, setHighVolatilityOnly] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Watchlist
    const { data: watchlistIds = [] } = useQuery<string[]>({
        queryKey: ["watchlist"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data } = await supabase.from("watchlists").select("condition_id").eq("user_id", user.id);
            return (data || []).map((r: any) => r.condition_id as string);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ conditionId, title, starred }: { conditionId: string; title: string; starred: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (starred) {
                await supabase.from("watchlists").delete().eq("user_id", user.id).eq("condition_id", conditionId);
            } else {
                await supabase.from("watchlists").upsert(
                    { user_id: user.id, condition_id: conditionId, market_title: title },
                    { onConflict: "user_id,condition_id" }
                );
            }
        },
        onMutate: async ({ conditionId, starred }) => {
            await queryClient.cancelQueries({ queryKey: ["watchlist"] });
            const prev = queryClient.getQueryData<string[]>(["watchlist"]) || [];
            queryClient.setQueryData<string[]>(["watchlist"],
                starred ? prev.filter(id => id !== conditionId) : [...prev, conditionId]
            );
            return { prev };
        },
        onError: (_err: unknown, _vars: unknown, ctx: any) => { if (ctx?.prev) queryClient.setQueryData(["watchlist"], ctx.prev); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
    });

    const toggleWatchlist = (e: React.MouseEvent, conditionId: string, title: string) => {
        e.preventDefault();
        toggleMutation.mutate({ conditionId, title, starred: watchlistIds.includes(conditionId) });
    };

    const { data: markets, isLoading } = useQuery({
        queryKey: ["activeMarkets"],
        queryFn: () => fetchActiveMarketsAction(200),
        refetchInterval: 300000,
        staleTime: 60000,
    });

    const filteredAndSorted = useMemo(() => {
        if (!markets) return [];
        let result = markets.filter((market: any) => {
            const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
            if (selectedCategory === "Watchlist") return matchesSearch && watchlistIds.includes(market.conditionId);
            const matchesCategory = selectedCategory === "All" || market.category === selectedCategory;
            const matchesVolatility = !highVolatilityOnly || (market.probabilityNum >= 40 && market.probabilityNum <= 60);
            return matchesSearch && matchesCategory && matchesVolatility;
        });
        return sortMarkets(result, sortKey);
    }, [markets, searchQuery, selectedCategory, watchlistIds, highVolatilityOnly, sortKey]);

    const visibleMarkets = filteredAndSorted.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSorted.length;
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label ?? "Sort";

    return (
        <div className="flex flex-col gap-5 h-full w-full max-w-7xl mx-auto pb-12">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" /> Global Markets
                </h1>
                <p className="text-muted text-xs mt-1">
                    {markets ? `${filteredAndSorted.length} markets` : "Loading…"} · fetched from Polymarket
                </p>
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-3">
                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setVisibleCount(PAGE_SIZE); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                                ${selectedCategory === cat
                                    ? "bg-primary text-background shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                                    : "bg-surface border border-border text-muted hover:text-white hover:bg-white/5"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Sort row */}
                <div className="flex flex-wrap items-center gap-3">
                    <SlidersHorizontal className="w-4 h-4 text-muted flex-shrink-0" />

                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(m => !m)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-md text-xs text-muted hover:text-white hover:border-primary/40 transition-colors"
                        >
                            {currentSortLabel}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                        </button>
                        {showSortMenu && (
                            <div className="absolute top-full mt-1 left-0 z-30 bg-surface border border-border rounded-lg shadow-xl min-w-[200px] py-1 overflow-hidden">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSortKey(opt.value); setShowSortMenu(false); setVisibleCount(PAGE_SIZE); }}
                                        className={`w-full text-left px-4 py-2 text-xs transition-colors ${sortKey === opt.value ? "text-primary bg-primary/10" : "text-muted hover:text-white hover:bg-white/5"}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* High Volatility toggle */}
                    <button
                        onClick={() => { setHighVolatilityOnly(v => !v); setVisibleCount(PAGE_SIZE); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors
                            ${highVolatilityOnly
                                ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                : "bg-surface border-border text-muted hover:text-white"}`}
                    >
                        <Flame className="w-3.5 h-3.5" />
                        High Volatility (40–60%)
                    </button>

                    <span className="text-xs text-muted ml-auto hidden sm:block">
                        {filteredAndSorted.length} results
                    </span>
                </div>
            </div>

            {searchQuery && (
                <div className="text-xs text-primary p-2.5 bg-primary/10 border border-primary/20 rounded-lg inline-block self-start">
                    Results for: <span className="font-bold">"{searchQuery}"</span>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="glass-panel p-6 animate-pulse flex flex-col min-h-[200px]">
                            <div className="h-5 bg-white/5 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-white/5 rounded w-1/4 mb-6" />
                            <div className="mt-auto flex justify-between items-end">
                                <div className="h-8 bg-white/5 rounded w-14" />
                                <div className="h-5 bg-white/5 rounded w-20" />
                            </div>
                        </div>
                    ))
                ) : visibleMarkets.length > 0 ? (
                    visibleMarkets.map((market: any) => {
                        const prob = parseFloat(market.probability);
                        const isHigh = prob > 60;
                        const isVolatile = prob >= 40 && prob <= 60;
                        return (
                            <Link
                                href={`/dashboard/markets/${market.conditionId}`}
                                key={market.id}
                                className="group glass-panel p-5 flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden min-h-[200px]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex justify-between items-start mb-3 gap-3">
                                    <h3 className="text-sm font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                        {market.title}
                                    </h3>
                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                        <button onClick={(e) => toggleWatchlist(e, market.conditionId, market.title)} className="text-muted hover:text-yellow-400 transition-colors z-10">
                                            <Star className={`w-4 h-4 transition-all ${watchlistIds.includes(market.conditionId) ? "fill-yellow-400 text-yellow-400 scale-110" : ""}`} />
                                        </button>
                                        {isVolatile && (
                                            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                                <Flame className="w-2.5 h-2.5" /> HOT
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[10px] font-semibold text-muted/70 uppercase tracking-wider mb-auto">
                                    {market.category}
                                </div>

                                <div className="mt-5 flex justify-between items-end border-t border-border/50 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted mb-1">PROBABILITY</span>
                                        {market.probability === "N/A" ? (
                                            <div className="bg-white/10 text-muted px-2 py-0.5 rounded text-sm font-bold">N/A</div>
                                        ) : (
                                            <div className={`flex items-center gap-0.5 font-extrabold px-2 py-0.5 rounded text-lg ${isHigh ? "bg-positive/20 text-positive" : isVolatile ? "bg-orange-500/20 text-orange-400" : "bg-negative/20 text-negative"}`}>
                                                {market.probability}%
                                                {isHigh && <ArrowUpRight className="w-4 h-4 opacity-80" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-muted mb-1 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> VOL</span>
                                        <span className="text-xs font-bold text-gray-300">{market.volume || "$0"}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted border border-dashed border-border rounded-xl">
                        <TrendingUp className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">No markets matched your filters.</p>
                    </div>
                )}
            </div>

            {/* Load More */}
            {!isLoading && hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                        className="px-6 py-2.5 bg-surface border border-border text-muted text-sm font-semibold rounded-lg hover:text-white hover:border-primary/40 transition-colors"
                    >
                        Load More ({filteredAndSorted.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
}

export default function MarketsPage() {
    return (
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-muted">Loading markets…</div>}>
            <MarketsContent />
        </Suspense>
    );
}
