"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveMarketsAction } from "@/lib/actions";
import Link from "next/link";
import { Star, TrendingUp, ArrowUpRight, BarChart2, Activity } from "lucide-react";

function WatchlistContent() {
    const [watchlist, setWatchlist] = useState<string[]>([]);

    // Client-side hydration for localStorage
    useEffect(() => {
        const saved = localStorage.getItem('polylens_watchlist');
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
    }, []);

    const toggleWatchlist = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setWatchlist(prev => {
            const next = prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id];
            localStorage.setItem('polylens_watchlist', JSON.stringify(next));
            return next;
        });
    };

    const { data: markets, isLoading } = useQuery({
        queryKey: ['activeMarkets'],
        queryFn: () => fetchActiveMarketsAction(50),
        refetchInterval: 300000, // 5 min
    });

    const filteredMarkets = markets?.filter((market: any) => watchlist.includes(market.id.toString()));

    return (
        <div className="flex flex-col gap-6 h-full w-full max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                        My Watchlist
                    </h1>
                    <p className="text-muted text-sm">Your hand-picked markets and custom alpha signals.</p>
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
                        <Link href={`/dashboard/markets/${market.conditionId}`} key={market.id} className="group glass-panel p-6 flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden min-h-[220px]">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-4 gap-4">
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                    {market?.title}
                                </h3>
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={(e) => toggleWatchlist(e, market?.id?.toString())}
                                        className="text-muted hover:text-yellow-400 transition-colors z-10"
                                    >
                                        <Star className={`w-5 h-5 ${watchlist.includes(market?.id?.toString()) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
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
                                        <div className={`flex items-center gap-1 font-extrabold px-2 py-1 rounded-sm text-xl mt-1 self-start ${market?.probability > 50 ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>
                                            {market?.probability}¢
                                            {market?.probability > 50 ? <ArrowUpRight className="w-5 h-5 opacity-80" /> : null}
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
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center glass-panel border-dashed border-border group hover:border-primary/30 transition-colors">
                        <Star className="w-16 h-16 fill-transparent stroke-muted mb-4 group-hover:stroke-primary group-hover:fill-primary/20 transition-all" />
                        <h3 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h3>
                        <p className="text-sm text-gray-400 max-w-md">
                            Start adding markets you care about by clicking the Star icon on the Global Markets page to track custom alpha signals.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WatchlistPage() {
    return (
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-muted">Loading watchlist...</div>}>
            <WatchlistContent />
        </Suspense>
    );
}
