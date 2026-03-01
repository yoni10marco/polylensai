"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchActiveMarketsAction } from "@/lib/actions";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Star, TrendingUp, ArrowUpRight, BarChart2, Activity } from "lucide-react";

function WatchlistContent() {
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Fetch watchlist condition IDs from Supabase
    const { data: watchlist = [], isLoading: watchlistLoading } = useQuery({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("watchlists")
                .select("condition_id");
            if (error) throw error;
            return (data || []).map((r: any) => r.condition_id as string);
        },
    });

    // Add to watchlist
    const addMutation = useMutation({
        mutationFn: async ({ condition_id, market_title }: { condition_id: string; market_title: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");
            const { error } = await supabase.from("watchlists").insert({ user_id: user.id, condition_id, market_title });
            if (error && error.code !== "23505") throw error; // ignore unique conflict
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    // Remove from watchlist (with optimistic update)
    const removeMutation = useMutation({
        mutationFn: async (condition_id: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase.from("watchlists").delete()
                .eq("user_id", user.id).eq("condition_id", condition_id);
            if (error) throw error;
        },
        onMutate: async (condition_id) => {
            await queryClient.cancelQueries({ queryKey: ['watchlist'] });
            const prev = queryClient.getQueryData<string[]>(['watchlist']) || [];
            queryClient.setQueryData<string[]>(['watchlist'], prev.filter(id => id !== condition_id));
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(['watchlist'], ctx.prev);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
    });

    function toggleWatchlist(e: React.MouseEvent, conditionId: string, title: string) {
        e.preventDefault();
        if (watchlist.includes(conditionId)) {
            removeMutation.mutate(conditionId);
        } else {
            addMutation.mutate({ condition_id: conditionId, market_title: title });
        }
    }

    const { data: markets, isLoading: marketsLoading } = useQuery({
        queryKey: ['activeMarkets'],
        queryFn: () => fetchActiveMarketsAction(50),
        refetchInterval: 300000,
    });

    const isLoading = watchlistLoading || marketsLoading;
    const filteredMarkets = markets?.filter((m: any) => watchlist.includes(m.conditionId));

    return (
        <div className="flex flex-col gap-6 h-full w-full max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                        My Watchlist
                    </h1>
                    <p className="text-muted text-sm">Your hand-picked markets — synced across all your devices.</p>
                </div>
                <Link href="/dashboard/markets" className="text-primary text-sm font-semibold hover:text-white transition-colors bg-primary/10 px-4 py-2 rounded-md">
                    Explore More Markets
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
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
                        <Link href={`/dashboard/markets/${market.conditionId}`} key={market.conditionId} className="group glass-panel p-6 flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden min-h-[220px]">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                    {market?.title}
                                </h3>
                                <button
                                    onClick={(e) => toggleWatchlist(e, market.conditionId, market.title)}
                                    className="shrink-0 p-1.5 rounded-full hover:bg-yellow-500/20 transition-colors"
                                >
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mb-auto">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-muted border border-border">
                                    {market.category}
                                </span>
                            </div>
                            <div className="flex items-end justify-between mt-4 pt-4 border-t border-border">
                                <div>
                                    <p className="text-muted text-xs mb-0.5">Probability (Yes)</p>
                                    <p className={`text-3xl font-extrabold ${parseFloat(market.probability) > 50 ? 'text-positive' : 'text-negative'}`}>
                                        {market.probability !== "N/A" ? `${market.probability}%` : "N/A"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted text-xs mb-0.5 flex items-center gap-1 justify-end"><BarChart2 className="w-3 h-3" />Volume</p>
                                    <p className="text-white font-bold">{market.volume}</p>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center glass-panel p-16 text-center gap-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-full">
                            <Star className="w-10 h-10 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-white mb-1">Your watchlist is empty</p>
                            <p className="text-muted text-sm">Star markets from the Markets page to track them here.</p>
                        </div>
                        <Link href="/dashboard/markets" className="mt-2 px-5 py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-lg font-semibold text-sm hover:bg-primary/30 transition-colors">
                            Browse Markets
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WatchlistPage() {
    return <WatchlistContent />;
}
