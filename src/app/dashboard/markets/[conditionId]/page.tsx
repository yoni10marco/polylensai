"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarketPriceHistoryAction, fetchMarketByConditionId } from "@/lib/actions";
import PriceChart from "@/components/dashboard/PriceChart";
import MarketChat from "@/components/dashboard/MarketChat";
import { ArrowUpRight, Activity, TrendingUp, BarChart2, ExternalLink, AlertTriangle, Zap } from "lucide-react";

// Compute lag signal from the last N price points
function computeLagSignal(chartData: { time: string; price: number }[] | undefined) {
    if (!chartData || chartData.length < 5) return { active: false, strength: 0, label: "None", delta: 0 };
    const slice = chartData.slice(-5);
    const first = slice[0].price;
    const last = slice[slice.length - 1].price;
    const delta = Math.abs(last - first);
    // < 2% movement in last 5 points = lag signal
    const active = delta < 2;
    const strength = active ? (delta < 0.5 ? 3 : delta < 1.2 ? 2 : 1) : 0; // 3=Strong, 2=Moderate, 1=Weak
    const label = strength === 3 ? "Strong" : strength === 2 ? "Moderate" : strength === 1 ? "Weak" : "None";
    return { active, strength, label, delta: parseFloat(delta.toFixed(2)) };
}

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
    const lagSignal = computeLagSignal(chartData);

    const marketContext = {
        title: market?.title || "This market",
        probability: market?.probability || "N/A",
        headlines: [] as string[],
        priceHistory: chartData || [],
    };

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
        <div className="flex flex-col gap-6 w-full pb-8">
            {/* Hero Section */}
            <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1 min-w-0">
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-8 bg-white/5 rounded w-3/4 animate-pulse" />
                            <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
                        </div>
                    ) : (
                        <>
                            {/* Event title — the "what is this about" */}
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1 leading-tight">
                                {market?.title}
                            </h1>
                            {/* Resolution criteria — shown if different from the title */}
                            {market?.question && market.question !== market.title && (
                                <p className="text-sm text-muted leading-relaxed mt-1 max-w-2xl">
                                    <span className="text-primary/70 font-semibold uppercase text-xs tracking-widest mr-2">Resolves if</span>
                                    {market.question}
                                </p>
                            )}
                            <p className="text-muted text-xs font-mono break-all mt-2 opacity-50">{conditionId}</p>
                        </>
                    )}
                </div>

                <div className="flex gap-6 md:gap-8 shrink-0 flex-wrap">
                    <div className="flex flex-col items-end">
                        <span className="text-muted text-xs uppercase tracking-wider font-semibold mb-1">Probability (Yes)</span>
                        {isLoading ? (
                            <div className="h-10 bg-white/5 rounded w-24 animate-pulse" />
                        ) : (
                            <div className={`flex items-center gap-1 text-3xl font-extrabold px-3 py-1 rounded-lg ${market?.probability !== "N/A" && parseFloat(market?.probability || "0") > 50
                                    ? 'text-positive'
                                    : market?.probability === "N/A"
                                        ? 'text-muted'
                                        : 'text-negative'
                                }`}>
                                {market?.probability === "N/A" ? "N/A" : `${market?.probability}%`}
                                {currentPrice && currentPrice > 50 && <ArrowUpRight className="w-6 h-6 text-positive" />}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end border-l border-border pl-6 md:pl-8">
                        <span className="text-muted text-xs uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
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
                <div className="glass-panel p-5 md:p-6">
                    <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Outcomes</h2>
                    <div className="flex gap-3 flex-wrap">
                        {market.outcomes.map((outcome: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-white/5 border border-border rounded-lg px-4 py-2">
                                <span className="text-white font-semibold">{outcome}</span>
                                <span className={`text-lg font-bold ml-2 ${parseFloat(market.outcomePrices?.[i] || "0") > 50 ? 'text-positive' : 'text-negative'}`}>
                                    {market.outcomePrices?.[i] || "N/A"}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Chart */}
                <div className="flex-1 glass-panel p-5 md:p-6 flex flex-col min-h-[380px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold border-b-2 border-primary pb-1 inline-flex items-center gap-2">
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

                {/* Right Column */}
                <div className="w-full xl:w-96 flex flex-col gap-6">

                    {/* Lag Detector */}
                    {lagSignal.active && (
                        <div className={`glass-panel p-6 relative overflow-hidden group border-primary/50 bg-primary/5 ${lagSignal.strength === 3 ? 'shadow-[0_0_30px_rgba(0,229,255,0.15)]' : ''}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`relative bg-primary/20 p-2 rounded-full ${lagSignal.strength === 3 ? 'ring-2 ring-primary/50 animate-pulse' : ''}`}>
                                    <AlertTriangle className="w-5 h-5 text-primary" />
                                    {lagSignal.strength === 3 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-primary font-bold tracking-wider text-sm">LAG DETECTED</h3>
                                    <p className="text-xs text-primary/70 uppercase font-semibold">Potential Alpha Signal</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-300 leading-relaxed mb-4">
                                The market probability has moved only <span className="text-white font-bold">{lagSignal.delta}%</span> over the last 5 data points while market activity continues — a potential inefficiency window.
                            </p>

                            {/* Signal Strength Meter */}
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-muted uppercase tracking-widest font-semibold flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> Signal Strength
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${lagSignal.strength === 3 ? 'bg-positive/20 text-positive' :
                                            lagSignal.strength === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-white/10 text-muted'
                                        }`}>{lagSignal.label}</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3].map((bar) => (
                                        <div
                                            key={bar}
                                            className={`flex-1 h-2 rounded-full transition-all ${bar <= lagSignal.strength
                                                    ? lagSignal.strength === 3
                                                        ? 'bg-positive shadow-[0_0_8px_rgba(0,229,180,0.6)]'
                                                        : lagSignal.strength === 2
                                                            ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                                                            : 'bg-white/40'
                                                    : 'bg-white/10'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Market Info */}
                    <div className="glass-panel p-6">
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
                    </div>

                    {/* AI Chat Panel */}
                    {!isLoading && (
                        <MarketChat marketContext={marketContext} />
                    )}
                </div>
            </div>
        </div>
    );
}
