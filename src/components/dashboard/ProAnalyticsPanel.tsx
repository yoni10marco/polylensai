"use client";

import { useQuery } from "@tanstack/react-query";
import {
    fetchExtendedMarketDataAction,
    fetchBtcTrendAction,
} from "@/lib/actions";
import {
    Droplets,
    Zap,
    Activity,
    Bitcoin,
    TrendingUp,
    TrendingDown,
    Info,
    ChevronRight,
    Waves,
    ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProAnalyticsPanelProps {
    conditionId: string;
    chartData: { time: string; price: number }[];
    category: string;
}

const BTC_CATEGORIES = new Set(["Crypto", "Business", "Politics"]);

// ---------------------------------------------------------------------------
// Util helpers
// ---------------------------------------------------------------------------
function computeVolatilityScore(chartData: { price: number }[]): number {
    const last24 = chartData.slice(-24);
    if (last24.length < 3) return 0;
    const mean = last24.reduce((s, d) => s + d.price, 0) / last24.length;
    const variance = last24.reduce((s, d) => s + Math.pow(d.price - mean, 2), 0) / last24.length;
    const stddev = Math.sqrt(variance);
    // Map stddev → 1-10. Typical market stddev ranges 0-15% probability points
    return Math.min(10, Math.max(1, Math.round((stddev / 1.5) + 0.5)));
}

function formatUSDC(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Tooltip wrapper
// ---------------------------------------------------------------------------
function Tooltip({ text, children }: { text: string; children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 text-xs text-gray-200 bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 shadow-2xl pointer-events-none leading-relaxed text-center">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10" />
                </span>
            )}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------
function SkeletonCard() {
    return (
        <div className="bg-white/3 border border-white/8 rounded-xl p-5 animate-pulse space-y-3">
            <div className="h-3 bg-white/10 rounded w-1/2" />
            <div className="h-7 bg-white/10 rounded w-2/3" />
            <div className="h-2 bg-white/8 rounded w-full" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Gauge bar
// ---------------------------------------------------------------------------
function GaugeBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mt-2">
            <div
                className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Segmented volatility bar (10 segments)
// ---------------------------------------------------------------------------
function VolatilityBar({ score }: { score: number }) {
    return (
        <div className="flex gap-1 mt-2">
            {Array.from({ length: 10 }, (_, i) => {
                const active = i < score;
                let bg = "bg-white/10";
                if (active) {
                    if (score <= 3) bg = "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]";
                    else if (score <= 6) bg = "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]";
                    else bg = "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]";
                }
                return <div key={i} className={`flex-1 h-2 rounded-full transition-all ${bg}`} />;
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ProAnalyticsPanel({ conditionId, chartData, category }: ProAnalyticsPanelProps) {
    const showBtc = BTC_CATEGORIES.has(category);

    const { data: extData, isLoading: extLoading } = useQuery({
        queryKey: ["extendedMarket", conditionId],
        queryFn: () => fetchExtendedMarketDataAction(conditionId),
        refetchInterval: 60_000,
        staleTime: 30_000,
    });

    const { data: btcData, isLoading: btcLoading } = useQuery({
        queryKey: ["btcTrend"],
        queryFn: fetchBtcTrendAction,
        enabled: showBtc,
        refetchInterval: 300_000,
        staleTime: 240_000,
    });

    const volatilityScore = useMemo(() => computeVolatilityScore(chartData), [chartData]);

    const orderBook = extData?.orderBook ?? null;
    const whaleData = extData?.whaleData ?? null;
    const isLoading = extLoading;

    // Colour helpers
    const slippageColor =
        !orderBook ? "bg-white/20"
            : orderBook.slippagePct < 0.5 ? "bg-emerald-400"
                : orderBook.slippagePct < 2 ? "bg-yellow-400"
                    : "bg-red-500";

    const slippageLabel =
        !orderBook ? "–"
            : orderBook.slippagePct < 0.5 ? "Low Impact"
                : orderBook.slippagePct < 2 ? "Moderate"
                    : "High Impact";

    const volLabel =
        volatilityScore === 0 ? "No Data"
            : volatilityScore <= 3 ? "Stable"
                : volatilityScore <= 6 ? "Moderate"
                    : "High Turbulence";

    const volColor =
        volatilityScore <= 3 ? "text-emerald-400"
            : volatilityScore <= 6 ? "text-yellow-400"
                : "text-red-400";

    return (
        <div className="glass-panel p-6 md:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-primary/15 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                        Pro Analytics
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wider">Beta</span>
                    </h2>
                    <p className="text-xs text-muted">Real-time order book, volatility & smart money signals</p>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* — Card 1: Liquidity Depth — */}
                {isLoading ? <SkeletonCard /> : (
                    <div className="bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-colors rounded-xl p-5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                                Liquidity Depth
                            </span>
                            <Tooltip text="Total USDC available within 5% of the current mid-price on both sides of the order book. Higher = easier to enter/exit large positions.">
                                <Info className="w-3.5 h-3.5 text-muted/50 cursor-help hover:text-muted transition-colors" />
                            </Tooltip>
                        </div>
                        <div className="text-2xl font-extrabold text-white">
                            {orderBook ? formatUSDC(orderBook.liquidityDepth) : <span className="text-muted text-base">No Data</span>}
                        </div>
                        {orderBook && (
                            <>
                                <GaugeBar value={orderBook.liquidityDepth} max={100_000} colorClass="bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
                                <div className="flex justify-between text-[10px] text-muted">
                                    <span>Spread: {orderBook.spreadPct.toFixed(2)}%</span>
                                    <span>Bid {(orderBook.bestBid * 100).toFixed(1)}¢ · Ask {(orderBook.bestAsk * 100).toFixed(1)}¢</span>
                                </div>
                            </>
                        )}
                        {!orderBook && <p className="text-[11px] text-muted/60">Order book unavailable</p>}
                    </div>
                )}

                {/* — Card 2: Slippage for $1k — */}
                {isLoading ? <SkeletonCard /> : (
                    <div className="bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-colors rounded-xl p-5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                                <Waves className="w-3.5 h-3.5 text-purple-400" />
                                Slippage for $1k
                            </span>
                            <Tooltip text="How much the probability shifts if you buy $1,000 of shares right now. Under 0.5% is ideal; above 2% means thin liquidity.">
                                <Info className="w-3.5 h-3.5 text-muted/50 cursor-help hover:text-muted transition-colors" />
                            </Tooltip>
                        </div>
                        {orderBook ? (
                            <>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-extrabold text-white">{orderBook.slippagePct.toFixed(2)}%</span>
                                    <span className={`text-xs font-bold mb-0.5 px-2 py-0.5 rounded-full ${orderBook.slippagePct < 0.5 ? 'bg-emerald-500/15 text-emerald-400' : orderBook.slippagePct < 2 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                                        {slippageLabel}
                                    </span>
                                </div>
                                <GaugeBar value={Math.min(orderBook.slippagePct, 5)} max={5} colorClass={slippageColor} />
                                <p className="text-[10px] text-muted">Price impact of a market buy order</p>
                            </>
                        ) : (
                            <div className="text-muted text-base font-bold">No Data</div>
                        )}
                    </div>
                )}

                {/* — Card 3: Volatility Score — */}
                <div className="bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-colors rounded-xl p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-yellow-400" />
                            Volatility Score
                        </span>
                        <Tooltip text="Standard deviation of probability over the last 24 data points, mapped to a 1–10 scale. 1 = Stable/Stagnant, 10 = High Turbulence. The Lag Detector is most effective on high-volatility markets.">
                            <Info className="w-3.5 h-3.5 text-muted/50 cursor-help hover:text-muted transition-colors" />
                        </Tooltip>
                    </div>
                    {volatilityScore > 0 ? (
                        <>
                            <div className="flex items-end gap-2">
                                <span className={`text-2xl font-extrabold ${volColor}`}>{volatilityScore}<span className="text-base font-semibold text-muted">/10</span></span>
                                <span className={`text-xs font-bold mb-0.5 px-2 py-0.5 rounded-full ${volatilityScore <= 3 ? 'bg-emerald-500/15 text-emerald-400' : volatilityScore <= 6 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>{volLabel}</span>
                            </div>
                            <VolatilityBar score={volatilityScore} />
                            <p className="text-[10px] text-muted">Based on last {Math.min(chartData.length, 24)} price points</p>
                        </>
                    ) : (
                        <div className="text-muted text-sm">Insufficient price history</div>
                    )}
                </div>

                {/* — Card 4: BTC Correlation (conditional) — */}
                {showBtc ? (
                    btcLoading ? <SkeletonCard /> : (
                        <div className="bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-colors rounded-xl p-5 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                                    <Bitcoin className="w-3.5 h-3.5 text-orange-400" />
                                    BTC Correlation
                                </span>
                                <Tooltip text="Bitcoin's 24h price change. If this market is tagged Crypto or Macro, large BTC moves may influence outcomes — helping you separate market-specific news from global trends.">
                                    <Info className="w-3.5 h-3.5 text-muted/50 cursor-help hover:text-muted transition-colors" />
                                </Tooltip>
                            </div>
                            {btcData ? (
                                <>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-extrabold text-white">${btcData.price.toLocaleString()}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-sm font-bold ${btcData.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {btcData.change24h >= 0
                                            ? <TrendingUp className="w-4 h-4" />
                                            : <TrendingDown className="w-4 h-4" />
                                        }
                                        {btcData.change24h >= 0 ? '+' : ''}{btcData.change24h}% in 24h
                                    </div>
                                    <p className="text-[10px] text-muted">
                                        {btcData.change24h >= 2
                                            ? "BTC rallying — check if this market moves in sync"
                                            : btcData.change24h <= -2
                                                ? "BTC declining — macro pressure may affect this market"
                                                : "BTC relatively stable — market moves are likely news-driven"
                                        }
                                    </p>
                                </>
                            ) : (
                                <div className="text-muted text-sm">BTC data unavailable (rate limit)</div>
                            )}
                        </div>
                    )
                ) : (
                    /* Placeholder card when BTC correlation is not applicable */
                    <div className="bg-white/[0.02] border border-dashed border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center">
                        <ShieldAlert className="w-6 h-6 text-muted/30" />
                        <p className="text-[11px] text-muted/40 font-medium">BTC correlation only shown for Crypto, Business & Politics markets</p>
                    </div>
                )}
            </div>

            {/* Whale Trades Section */}
            <div className="border-t border-white/[0.06] pt-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-orange-400" />
                        Large Trades (Last 24h)
                        <Tooltip text="Individual trades worth $1,000+ USDC. These 'whale moves' indicate that smart money is taking a meaningful position in this market.">
                            <Info className="w-3.5 h-3.5 text-muted/50 cursor-help hover:text-muted transition-colors" />
                        </Tooltip>
                    </h3>
                    {whaleData && whaleData.totalWhaleVolume > 0 && (
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                            {formatUSDC(whaleData.totalWhaleVolume)} whale volume
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : whaleData && whaleData.whaleTrades.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {whaleData.whaleTrades.slice(0, 15).map((trade: any, i: number) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-colors ${trade.side === "BUY"
                                    ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                                    : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${trade.side === "BUY"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                        }`}>
                                        {trade.side}
                                    </span>
                                    <span className="font-bold text-white">{formatUSDC(trade.usdcValue)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted text-xs">
                                    <span>{trade.formattedTime}</span>
                                    <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center border border-dashed border-white/[0.06] rounded-xl">
                        <Activity className="w-8 h-8 text-muted/20" />
                        <p className="text-sm text-muted/50">No large trades detected in the last 24h</p>
                        <p className="text-[11px] text-muted/30">Trades below $1,000 USDC are filtered out</p>
                    </div>
                )}
            </div>
        </div>
    );
}
