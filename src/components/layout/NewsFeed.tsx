"use client";

import { Clock, Loader2, Sparkles, TrendingDown, TrendingUp, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRealtimeNews } from "@/lib/api";
import AIChatDrawer, { AIChatContext } from "../dashboard/AIChatDrawer";

type NewsItem = {
    id: string;
    title: string;
    timestamp: string;
    sentiment?: "Positive" | "Negative" | "Neutral";
    impactScore?: number;
    reasoning?: string;
    suggestedTrade?: string;
};

const INITIAL_NEWS: NewsItem[] = [
    { id: "1", title: "New swing state poll shows tightening race in PA", timestamp: "10m ago" },
    { id: "2", title: "Major debate performance shifts overall odds", timestamp: "1h ago" },
    { id: "3", title: "Key endorsement missed, odds drop 2%", timestamp: "3h ago" },
    { id: "4", title: "Record volume traded on Swing State markets today", timestamp: "5h ago" },
    { id: "5", title: "Campaign finance report reveals cash disadvantage", timestamp: "12h ago" },
];

export default function NewsFeed() {
    const { data: liveNews } = useQuery({
        queryKey: ['realtimeNews'],
        queryFn: () => fetchRealtimeNews(),
        refetchInterval: 15000, // Simulate fresh poll every 15s
    });

    const [news, setNews] = useState<NewsItem[]>([]);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatContext, setChatContext] = useState<AIChatContext>({});

    // Sync mock stream to our local state which holds the AI mutations
    useEffect(() => {
        if (liveNews) {
            setNews((prev) => {
                // simple merge keeping existing AI analysis
                const merged = [...liveNews.map(n => ({ id: n.id.toString(), title: n.title, timestamp: n.time }))];
                prev.forEach(p => {
                    const idx = merged.findIndex(m => m.id === p.id);
                    if (idx !== -1 && p.sentiment) {
                        merged[idx] = { ...merged[idx], ...p };
                    }
                });
                return merged;
            });
        }
    }, [liveNews]);

    const handleOpenChat = (item: NewsItem) => {
        setChatContext({
            newsTitle: item.title,
            impactScore: item.impactScore,
        });
        setChatOpen(true);
    };

    const handleAnalyze = async (id: string, text: string) => {
        setAnalyzingId(id);
        try {
            const response = await fetch("/api/analyze-news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze text");
            }

            const data = await response.json();

            setNews((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            sentiment: data.sentiment,
                            impactScore: data.impact_score,
                            reasoning: data.reasoning,
                            suggestedTrade: data.suggested_trade
                        }
                        : item
                )
            );
        } catch (error) {
            console.error("AI Analysis Failed", error);
            alert("AI Analysis failed. Check console and API key.");
        } finally {
            setAnalyzingId(null);
        }
    };

    return (
        <aside className="w-96 border-l border-border bg-surface flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                    Live News Feed
                </h2>
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {news.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors flex flex-col gap-3 group">

                        <h3 className="text-sm font-medium text-white group-hover:text-primary transition-colors leading-relaxed">
                            {item.title}
                        </h3>

                        <div className="flex items-center text-xs text-muted">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.timestamp}
                        </div>

                        {/* AI Results Section */}
                        {item.reasoning ? (
                            <div className="mt-2 p-3 bg-surface rounded-md border border-border/50 text-xs">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded font-medium ${item.sentiment === 'Positive' ? 'bg-positive/10 text-positive' :
                                        item.sentiment === 'Negative' ? 'bg-negative/10 text-negative' :
                                            'bg-muted/10 text-muted'
                                        }`}>
                                        {item.sentiment}
                                    </span>
                                    <div className="flex items-center gap-1 font-bold font-mono">
                                        <span className="text-muted mr-1">Impact:</span>
                                        <span className={`px-1.5 rounded ${item.impactScore && item.impactScore >= 8 ? 'bg-primary/20 text-primary' : item.impactScore && item.impactScore >= 6 ? 'text-white' : 'text-muted'}`}>
                                            {item.impactScore}/10
                                        </span>
                                    </div>
                                </div>
                                <p className="text-muted mb-2 leading-relaxed">{item.reasoning}</p>
                                <div className="flex items-center gap-1 font-semibold text-primary">
                                    <span>Trade Signal:</span> {item.suggestedTrade}
                                </div>
                                <button
                                    onClick={() => handleOpenChat(item)}
                                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-secondary/10 text-white text-xs font-semibold hover:bg-white/10 transition-colors border border-border"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Discuss with AI
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleAnalyze(item.id, item.title)}
                                disabled={analyzingId !== null}
                                className="mt-2 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
                            >
                                {analyzingId === item.id ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Analyzing Quant Data...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Analyze with AI
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <AIChatDrawer
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                context={chatContext}
            />
        </aside>
    );
}
