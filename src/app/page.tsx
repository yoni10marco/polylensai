"use client";

import PriceChart from "@/components/dashboard/PriceChart";
import { fetchMarketPriceHistory } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export default function Home() {
    const { data: chartData, isLoading, isError } = useQuery({
        queryKey: ['marketHistory'],
        queryFn: () => fetchMarketPriceHistory(),
        refetchInterval: 60000, // Refetch every minute
    });

    return (
        <div className="flex flex-col gap-6 h-full">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">MicroStrategy Sells Bitcoin?</h1>
                <p className="text-sm text-muted">MicroStrategy sells any Bitcoin by December 31, 2026</p>
            </header>

            <div className="flex-1 min-h-0 glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold border-b-2 border-primary pb-1 inline-block">Probability Chart</h2>
                    <div className="flex gap-2 items-center">
                        <Link href="/markets/111128191581505463501777127559667396812474366956707382672202929745167742497287" className="mr-4 text-xs font-semibold px-4 py-1.5 border border-primary/30 rounded text-primary hover:bg-primary/20 transition-colors">
                            Deep Dive &rarr;
                        </Link>
                        <span className="text-sm px-3 py-1 rounded bg-positive/20 text-positive flex items-center gap-1 font-medium">
                            <span className="w-2 h-2 rounded-full bg-positive inline-block animate-pulse"></span>
                            Live
                        </span>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-muted flex flex-col items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                <p>Loading market data...</p>
                            </div>
                        </div>
                    ) : isError ? (
                        <div className="w-full h-full flex items-center justify-center text-negative">
                            Failed to load market data.
                        </div>
                    ) : (
                        <PriceChart data={chartData || []} />
                    )}
                </div>
            </div>
        </div>
    );
}
