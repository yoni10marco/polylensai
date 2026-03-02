"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeSocialIntelligenceAction } from "@/lib/actions";
import type { SocialAnalysis } from "@/lib/actions";
import {
    LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
    ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
    Brain, TrendingUp, TrendingDown, Minus,
    RefreshCw, Info, Newspaper, MessageSquare,
    Zap, AlertTriangle, BarChart2,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SocialIntelligencePanelProps {
    conditionId: string;
    marketTitle: string;
    probability: string;
    category: string;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
function Tip({ text, children }: { text: string; children: ReactNode }) {
    const [v, setV] = useState(false);
    return (
        <span className="relative inline-flex" onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}>
            {children}
            {v && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-60 text-xs text-gray-200 bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 shadow-2xl pointer-events-none leading-relaxed text-center">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10" />
                </span>
            )}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Sentiment Arc Gauge (SVG)
// ---------------------------------------------------------------------------
function SentimentGauge({ score }: { score: number }) {
    // score: -1 to +1, map to 0–180deg arc
    const pct = (score + 1) / 2; // 0 → 1
    const angle = pct * 180 - 90; // -90 (left) to +90 (right)
    const r = 60;
    const cx = 80;
    const cy = 80;

    // Arc from 180° to 0° (left to right)
    const startX = cx - r;
    const startY = cy;
    const endX = cx + r;
    const endY = cy;

    // Gradient color: red → yellow → green
    const color = score < -0.3 ? "#ef4444" : score < 0.3 ? "#eab308" : "#10b981";

    // Needle tip
    const rad = (angle * Math.PI) / 180;
    const needleX = cx + (r - 10) * Math.cos(rad);
    const needleY = cy + (r - 10) * Math.sin(rad);

    return (
        <div className="flex flex-col items-center">
            <svg width="160" height="90" viewBox="0 0 160 90">
                {/* Background arc */}
                <path
                    d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* Colored arc up to needle */}
                <path
                    d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${needleX + 10 * Math.cos(rad)} ${needleY + 10 * Math.sin(rad)}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
                />
                {/* Needle */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={needleX}
                    y2={needleY}
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx={cx} cy={cy} r={5} fill={color} />
                {/* Labels */}
                <text x="15" y="88" fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="middle">−1</text>
                <text x="80" y="16" fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="middle">0</text>
                <text x="145" y="88" fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="middle">+1</text>
            </svg>
            <div className="flex flex-col items-center -mt-1">
                <span className="text-3xl font-extrabold" style={{ color }}>
                    {score > 0 ? "+" : ""}{score.toFixed(2)}
                </span>
                <span className="text-xs text-muted mt-0.5">Sentiment Score</span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Velocity badge
// ---------------------------------------------------------------------------
function VelocityBadge({ velocity }: { velocity: string }) {
    const cfg = {
        Low: { color: "text-sky-400 bg-sky-500/15 border-sky-500/30", icon: <Minus className="w-3 h-3" /> },
        Medium: { color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30", icon: <TrendingUp className="w-3 h-3" /> },
        High: { color: "text-red-400 bg-red-500/15 border-red-500/30", icon: <TrendingUp className="w-3 h-3" /> },
    }[velocity] ?? { color: "text-muted bg-white/5 border-white/10", icon: <Minus className="w-3 h-3" /> };

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${cfg.color}`}>
            {cfg.icon} {velocity} Velocity
        </span>
    );
}

// ---------------------------------------------------------------------------
// Alpha signal badge
// ---------------------------------------------------------------------------
function AlphaBadge({ signal }: { signal: string }) {
    if (signal === "None") return null;
    const isHigh = signal === "High";
    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${isHigh
            ? "bg-positive/15 border-positive/40 text-positive animate-pulse"
            : "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
            }`}>
            <Zap className="w-3.5 h-3.5" />
            {isHigh ? "⚡ HIGH ALPHA DETECTED" : "LOW ALPHA SIGNAL"}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Custom recharts tooltip
// ---------------------------------------------------------------------------
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
            <p className="font-bold">{label}</p>
            <p className="text-primary">Interest: {payload[0]?.value}</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function AnalysisSkeleton() {
    return (
        <div className="glass-panel p-6 md:p-8 flex flex-col gap-6 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg" />
                <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-40" />
                    <div className="h-3 bg-white/10 rounded w-64" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="h-24 bg-white/5 rounded-xl" />
                    <div className="h-8 bg-white/5 rounded-lg" />
                </div>
                <div className="h-36 bg-white/5 rounded-xl" />
            </div>
            <div className="h-28 bg-white/5 rounded-xl" />
            <p className="text-xs text-muted/50 text-center">Ingesting signals from NewsAPI, Reddit & CoinGecko…</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function SocialIntelligencePanel({
    conditionId, marketTitle, probability, category,
}: SocialIntelligencePanelProps) {
    const queryClient = useQueryClient();

    const { data: analysis, isLoading, isError } = useQuery<SocialAnalysis | null>({
        queryKey: ["socialIntelligence", conditionId],
        queryFn: () => analyzeSocialIntelligenceAction(conditionId, marketTitle, probability, category),
        staleTime: 10 * 60 * 1000,  // 10 min cache
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["socialIntelligence", conditionId] });
    };

    if (isLoading) return <AnalysisSkeleton />;

    const isHighAlpha = analysis?.alpha_signal === "High";

    return (
        <div className={`glass-panel p-6 md:p-8 flex flex-col gap-6 transition-all duration-500 ${isHighAlpha
            ? "border-positive/50 shadow-[0_0_40px_rgba(0,229,180,0.18)]"
            : ""
            }`}>

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isHighAlpha ? "bg-positive/20 ring-1 ring-positive/40" : "bg-purple-500/15"}`}>
                        <Brain className={`w-5 h-5 ${isHighAlpha ? "text-positive" : "text-purple-400"}`} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                            Social Intelligence
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">AI</span>
                        </h2>
                        <p className="text-xs text-muted">
                            Powered by NewsAPI · Reddit · CoinGecko → Gemini 2.5 Flash
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {analysis && <AlphaBadge signal={analysis.alpha_signal} />}
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 text-xs text-muted hover:text-white border border-border hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                </div>
            </div>

            {/* Error / No data state */}
            {(isError || !analysis) && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-white/10 rounded-xl text-center">
                    <AlertTriangle className="w-8 h-8 text-muted/30" />
                    <p className="text-sm text-muted/50">Social analysis unavailable</p>
                    <p className="text-xs text-muted/30">NewsAPI key may be missing, or all data sources returned empty results.</p>
                    <button onClick={handleRefresh} className="text-xs text-primary hover:underline mt-1">Try again</button>
                </div>
            )}

            {analysis && (
                <>
                    {/* Main grid: Sentiment + Narrative */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Left: Sentiment Meter */}
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 flex flex-col items-center gap-3">
                            <div className="w-full flex items-center justify-between mb-1">
                                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">Sentiment Meter</span>
                                <Tip text="Composite sentiment score from news headlines and Reddit posts, from -1.0 (fully bearish) to +1.0 (fully bullish).">
                                    <Info className="w-3.5 h-3.5 text-muted/40 cursor-help hover:text-muted" />
                                </Tip>
                            </div>
                            <SentimentGauge score={analysis.sentiment_score} />
                            <div className="flex items-center gap-3 mt-1">
                                <VelocityBadge velocity={analysis.velocity} />
                            </div>
                        </div>

                        {/* Right: Narrative Insight */}
                        <div className={`relative rounded-xl p-5 border flex flex-col gap-3 overflow-hidden ${isHighAlpha
                            ? "bg-positive/5 border-positive/30"
                            : "bg-white/[0.03] border-white/[0.07]"
                            }`}>
                            {isHighAlpha && (
                                <div className="absolute inset-0 bg-gradient-to-br from-positive/5 to-transparent pointer-events-none" />
                            )}
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] uppercase tracking-wider font-semibold ${isHighAlpha ? "text-positive/80" : "text-muted"}`}>
                                    Primary Narrative
                                </span>
                                <Tip text="The single most influential argument driving the social conversation around this market, identified by the Alpha Analyst.">
                                    <Info className="w-3.5 h-3.5 text-muted/40 cursor-help hover:text-muted" />
                                </Tip>
                            </div>
                            <p className={`text-sm font-semibold leading-relaxed ${isHighAlpha ? "text-positive" : "text-white"}`}>
                                "{analysis.primary_narrative}"
                            </p>
                            <div className="border-t border-white/[0.06] pt-3">
                                <p className="text-xs text-muted leading-relaxed">{analysis.reasoning}</p>
                            </div>
                        </div>
                    </div>

                    {/* Social Data Stats Row */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5">
                            <Newspaper className="w-4 h-4 text-sky-400" />
                            <span className="text-sm font-bold text-white">{analysis.news_count}</span>
                            <span className="text-xs text-muted">news articles</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5">
                            <MessageSquare className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-bold text-white">{analysis.reddit_count}</span>
                            <span className="text-xs text-muted">Reddit posts (24h)</span>
                        </div>
                        {analysis.top_reddit_posts.length > 0 && (
                            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5">
                                <TrendingUp className="w-4 h-4 text-positive" />
                                <span className="text-xs text-muted">Top post score:</span>
                                <span className="text-sm font-bold text-white">↑{analysis.top_reddit_posts[0]?.score?.toLocaleString()}</span>
                                <span className="text-xs text-muted">r/{analysis.top_reddit_posts[0]?.subreddit}</span>
                            </div>
                        )}
                    </div>

                    {/* Trend Sparkline */}
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                                <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                                Social Interest (7-day buzz)
                            </span>
                            <Tip text="Normalized volume of news articles and Reddit posts about this market over the last 7 days. 100 = peak activity day.">
                                <Info className="w-3.5 h-3.5 text-muted/40 cursor-help hover:text-muted" />
                            </Tip>
                        </div>
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={analysis.trend_points} margin={{ top: 4, right: 8, left: -30, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="socialGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isHighAlpha ? "#00e5b4" : "#a855f7"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isHighAlpha ? "#00e5b4" : "#a855f7"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <ReTooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isHighAlpha ? "#00e5b4" : "#a855f7"}
                                    strokeWidth={2}
                                    fill="url(#socialGrad)"
                                    dot={{ fill: isHighAlpha ? "#00e5b4" : "#a855f7", r: 3, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Reddit Posts */}
                    {analysis.top_reddit_posts.length > 0 && (
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
                            <h4 className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-3 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                                Top Reddit Signals
                            </h4>
                            <div className="space-y-2">
                                {analysis.top_reddit_posts.map((post, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.05] last:border-0">
                                        <p className="text-xs text-gray-300 leading-relaxed flex-1 line-clamp-1">{post.title}</p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-muted">r/{post.subreddit}</span>
                                            <span className="text-[10px] font-bold text-positive bg-positive/10 px-1.5 py-0.5 rounded">↑{post.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
