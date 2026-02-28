"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveMarkets } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TrendingUp, ArrowUpRight, BarChart2, Activity } from "lucide-react";

const CATEGORIES = ["All", "Crypto", "Politics", "Pop Culture", "Sports"];

export default function MarketsPage() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || "";
    const [selectedCategory, setSelectedCategory] = useState("All");

    const { data: markets, isLoading } = useQuery({
        queryKey: ['activeMarkets'],
        queryFn: () => fetchActiveMarkets(),
        refetchInterval: 300000, // 5 min
    });

    const filteredMarkets = markets?.filter((market: any) => {
        const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase());
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
                        <Link href={`/dashboard/markets/${market.id}`} key={market.id} className="group glass-panel p-6 flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden min-h-[220px]">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-4 gap-4">
                                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                    {market.title}
                                </h3>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${market.sentiment === 'Positive' ? 'bg-positive/20 text-positive' :
                                        market.sentiment === 'Negative' ? 'bg-negative/20 text-negative' :
                                            'bg-white/10 text-muted'
                                    }`}>
                                    <Activity className="w-3 h-3" />
                                    {market.sentiment}
                                </div>
                            </div>

                            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-auto">
                                {market.category}
                            </div>

                            <div className="mt-6 flex justify-between items-end border-t border-border/50 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted mb-1">PROBABILITY</span>
                                    <span className="text-3xl font-extrabold text-white flex items-center gap-1">
                                        {market.probability}¢
                                        {market.probability > 50 ? <ArrowUpRight className="w-5 h-5 text-positive" /> : null}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted mb-1 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> VOL</span>
                                    <span className="text-sm font-bold text-gray-300">${market.volume}</span>
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
