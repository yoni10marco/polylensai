"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketPriceHistoryAction } from "@/lib/actions";
import PriceChart from "@/components/dashboard/PriceChart";
import { ArrowUpRight, Activity } from "lucide-react";

export default function MarketDetailPage({ params }: { params: { id: string } }) {
    const { data: chartData, isLoading, isError } = useQuery({
        queryKey: ['marketHistory', params.id],
        queryFn: () => fetchMarketPriceHistoryAction(params.id),
        refetchInterval: 60000,
    });

    const currentPrice = chartData && chartData.length > 0 ? chartData[chartData.length - 1].price : 0;

    // MOCK Lag Detector logic:
    // In a real scenario, this would check the delta of probability over last 10 minutes vs the impact score of the latest news.
    const hasLagSignal = true; // Hardcoded true to demonstrate the feature as requested

    if (!isLoading && (!chartData || chartData.length === 0 || isError)) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-4">
                <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center text-center max-w-md">
                    <Activity className="w-12 h-12 text-negative mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
                    <p className="text-muted text-sm mb-6">
                        The market data you are looking for could not be loaded. It may have been resolved, archived, or does not exist.
                    </p>
                    <button onClick={() => window.history.back()} className="px-6 py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 transition-colors rounded-md font-bold">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full w-full">
            {/* Hero Section */}
            <div className="glass-panel p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Market Details</h1>
                    <p className="text-muted text-sm font-mono break-all">{params.id}</p>
                </div>

                <div className="flex gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-muted text-sm uppercase tracking-wider font-semibold">Current Probability</span>
                        <div className="text-4xl font-bold text-primary flex items-center gap-2">
                            {currentPrice > 0 ? `${currentPrice}¢` : '--'}
                            <ArrowUpRight className="w-6 h-6 text-positive" />
                        </div>
                    </div>

                    <div className="flex flex-col items-end border-l border-border pl-8">
                        <span className="text-muted text-sm uppercase tracking-wider font-semibold">24h Volume</span>
                        <span className="text-2xl font-bold text-white">$1.2M</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
                {/* Advanced Chart */}
                <div className="flex-1 glass-panel p-6 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold border-b-2 border-primary pb-1 inline-block">Advanced Probability History</h2>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        {isLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-muted flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                    Loading historical data...
                                </div>
                            </div>
                        ) : (
                            <PriceChart data={chartData || []} />
                        )}
                    </div>
                </div>

                {/* Signal Box & Stats */}
                <div className="w-full xl:w-96 flex flex-col gap-6">
                    {hasLagSignal && (
                        <div className="glass-panel p-6 border-primary/50 bg-primary/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-primary/20 p-2 rounded-full">
                                    <Activity className="w-6 h-6 text-primary animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-primary font-bold tracking-wider">LAG DETECTED</h3>
                                    <p className="text-xs text-primary/80 uppercase font-semibold">Potential Alpha Signal</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                A recent news event scored an <span className="text-white font-bold tracking-wide">Impact &gt; 8</span>, but the market probability has moved less than 2% in the last 10 minutes.
                            </p>
                            <button className="mt-4 w-full py-2 bg-primary/20 text-primary border border-primary/50 rounded-md text-sm font-semibold hover:bg-primary/30 transition-colors">
                                Analyze Market
                            </button>
                        </div>
                    )}

                    <div className="glass-panel p-6 flex-1">
                        <h3 className="font-semibold text-white mb-4 border-b border-border pb-2">Correlated News</h3>
                        <div className="space-y-4">
                            <p className="text-sm text-muted italic">Click "Discuss with AI" on any news item in the right sidebar to analyze its effect on this specific market.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
