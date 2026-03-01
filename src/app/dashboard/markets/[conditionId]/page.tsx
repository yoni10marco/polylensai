"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketPriceHistoryAction, fetchMarketByConditionId } from "@/lib/actions";
import PriceChart from "@/components/dashboard/PriceChart";
import { ArrowUpRight, Activity, TrendingUp, BarChart2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function MarketDetailPage({ params }: { params: { conditionId: string } }) {
    const { conditionId } = params;

    const { data: market, isLoading: marketLoading } = useQuery({
        queryKey: ['marketDetail', conditionId],
        queryFn: () => fetchMarketByConditionId(conditionId),
    });

    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ['marketHistory', conditionId],
        queryFn: () => fetchMarketPriceHistoryAction(conditionId),
        refetchInterval: 60000,
    });

    const isLoading = marketLoading || chartLoading;
    const currentPrice = chartData && chartData.length > 0 ? chartData[chartData.length - 1].price : null;
    const hasLagSignal = true;

    if (!isLoading && !market) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-4">
                <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center text-center max-w-md">
                    <Activity className="w-12 h-12 text-negative mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Market Not Found</h1>
                    <p className="text-muted text-sm mb-6">
                        The market data you are looking for could not be loaded. It may have resolved, been archived, or does not exist.
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
                <div className="flex-1 min-w-0">
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-8 bg-white/5 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold tracking-tight text-white mb-2 leading-tight">{market?.title}</h1>
                            <p className="text-muted text-xs font-mono break-all">{conditionId}</p>
                        </>
                    )}
                </div>

                <div className="flex gap-8 shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-muted text-sm uppercase tracking-wider font-semibold mb-1">Probability (Yes)</span>
                        {isLoading ? (
                            <div className="h-10 bg-white/5 rounded w-24 animate-pulse" />
                        ) : (
                            <div className={`flex items-center gap-1 text-3xl font-extrabold px-3 py-1 rounded-lg ${market?.probability !== "N/A" && parseFloat(market?.probability || "0") > 50
                                    ? 'text-positive'
                                    : market?.probability === "N/A"
                                        ? 'text-muted'
                                        : 'text-negative'
                                }`}>
                                {market?.probability === "N/A" ? "N/A" : `${market?.probability}¢`}
                                {currentPrice && currentPrice > 50 && <ArrowUpRight className="w-6 h-6 text-positive" />}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end border-l border-border pl-8">
                        <span className="text-muted text-sm uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                            <BarChart2 className="w-4 h-4" /> Volume
                        </span>
                        {isLoading ? (
                            <div className="h-8 bg-white/5 rounded w-20 animate-pulse" />
                        ) : (
                            <span className="text-2xl font-bold text-white">{market?.volume || "$0"}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Outcomes */}
            {!isLoading && market?.outcomes && market.outcomes.length > 0 && (
                <div className="glass-panel p-6">
                    <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Outcomes</h2>
                    <div className="flex gap-3 flex-wrap">
                        {market.outcomes.map((outcome: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 border border-border rounded-lg px-4 py-2">
                                <span className="text-white font-semibold">{outcome}</span>
                                <span className={`text-lg font-bold ml-2 ${parseFloat(market.outcomePrices?.[i] || "0") > 50 ? 'text-positive' : 'text-negative'
                                    }`}>
                                    {market.outcomePrices?.[i] || "N/A"}¢
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
                {/* Chart */}
                <div className="flex-1 glass-panel p-6 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold border-b-2 border-primary pb-1 inline-block flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Probability History
                        </h2>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        {chartLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-muted flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                    Loading historical data...
                                </div>
                            </div>
                        ) : chartData && chartData.length > 0 ? (
                            <PriceChart data={chartData} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2">
                                <BarChart2 className="w-10 h-10 opacity-30" />
                                <p className="text-sm">No historical data available for this market.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Signal Box & Stats */}
                <div className="w-full xl:w-96 flex flex-col gap-6">
                    {hasLagSignal && (
                        <div className="glass-panel p-6 border-primary/50 bg-primary/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        <h3 className="font-semibold text-white mb-4 border-b border-border pb-2 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-muted" />
                            Market Info
                        </h3>
                        <div className="space-y-3 text-sm">
                            {market?.endDate && (
                                <div className="flex justify-between">
                                    <span className="text-muted">End Date</span>
                                    <span className="text-white font-semibold">{market.endDate}</span>
                                </div>
                            )}
                            {market?.volume24hr && (
                                <div className="flex justify-between">
                                    <span className="text-muted">24hr Volume</span>
                                    <span className="text-white font-semibold">{market.volume24hr}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-border">
                                <a
                                    href={`https://polymarket.com/market/${market?.slug || conditionId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-semibold"
                                >
                                    View on Polymarket <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-sm text-muted italic">Click "Discuss with AI" on any news item in the sidebar to analyze its effect on this specific market.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
