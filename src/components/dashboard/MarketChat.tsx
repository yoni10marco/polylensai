"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, Send, Loader2, Zap, Lock } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
    streaming?: boolean;
}

interface MarketContext {
    title: string;
    probability: string;
    headlines: string[];
    priceHistory: { time: string; price: number }[];
}

interface MarketChatProps {
    marketContext: MarketContext | string;
    conditionId: string;
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#0d1117] border border-primary/30 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_40px_rgba(0,229,255,0.15)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-primary/10 border border-primary/30 rounded-full p-4">
                        <Lock className="w-7 h-7 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Daily Limit Reached</h3>
                <p className="text-muted text-sm text-center mb-6 leading-relaxed">
                    You've used all <span className="text-white font-semibold">3 free AI messages</span> for today.
                    Upgrade to Pro for unlimited market analysis.
                </p>
                <div className="space-y-3">
                    <a href="/dashboard/guide" className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                        <Zap className="w-4 h-4" /> Upgrade to Pro
                    </a>
                    <button onClick={onClose} className="w-full py-3 text-muted text-sm hover:text-white transition-colors">
                        Maybe later
                    </button>
                </div>
                <p className="text-xs text-muted/60 text-center mt-4">Limit resets at midnight UTC</p>
            </div>
        </div>
    );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <div className="bg-primary/20 border border-primary/30 rounded-full p-1.5 mr-2 shrink-0 self-end mb-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                </div>
            )}
            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                ? "bg-primary/15 border border-primary/25 text-white rounded-br-sm"
                : "bg-white/5 border border-white/8 text-gray-200 rounded-bl-sm"
                }`}>
                {message.text}
                {message.streaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm" />
                )}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MarketChat({ marketContext, conditionId }: MarketChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);

    // Usage tracking
    const [usedToday, setUsedToday] = useState(0);
    const [limit, setLimit] = useState<number | null>(3);
    const [tier, setTier] = useState<string>("free");
    const [usageLoaded, setUsageLoaded] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load usage on mount
    useEffect(() => {
        fetch("/api/chat-usage")
            .then(r => r.json())
            .then(d => {
                setUsedToday(d.used ?? 0);
                setLimit(d.limit ?? null);
                setTier(d.tier ?? "free");
                setUsageLoaded(true);
            })
            .catch(() => setUsageLoaded(true));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(text: string) {
        if (!text.trim() || isStreaming) return;

        // Check rate limit — fail-open so auth/server errors don't silently block messages
        try {
            const checkRes = await fetch("/api/chat-usage", { method: "POST" });
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.allowed === false) { setShowUpgrade(true); return; }
                if (checkData.used != null) setUsedToday(checkData.used);
            }
        } catch { /* network error — allow the message through */ }

        const userMessage: Message = { id: Date.now().toString(), role: "user", text: text.trim() };
        const assistantId = (Date.now() + 1).toString();
        const assistantMessage: Message = { id: assistantId, role: "assistant", text: "", streaming: true };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInput("");
        setIsStreaming(true);

        try {
            const response = await fetch("/api/market-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text.trim(), marketContext, conditionId }),
            });

            if (!response.ok || !response.body) throw new Error("Stream failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // API streams raw text — just decode and append directly
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, text: accumulated } : m
                ));
            }

            setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, text: accumulated, streaming: false } : m
            ));

        } catch (err) {
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, text: "Sorry, I couldn't generate a response. Please try again.", streaming: false }
                    : m
            ));
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    }

    const remaining = limit !== null ? Math.max(0, limit - usedToday) : null;
    const isAtLimit = tier === "free" && remaining === 0;

    return (
        <>
            {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

            <div className="glass-panel flex flex-col" style={{ height: "480px" }}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
                    <div className="bg-primary/20 p-1.5 rounded-full">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm leading-none">AI Market Chat</h3>
                        <p className="text-xs text-muted mt-0.5">Powered by Gemini 2.5 Flash</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {/* Usage badge for free users */}
                        {usageLoaded && tier === "free" && limit !== null && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${remaining === 0
                                ? "text-red-400 border-red-400/30 bg-red-400/10"
                                : remaining === 1
                                    ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                                    : "text-primary border-primary/30 bg-primary/10"
                                }`}>
                                {remaining}/{limit} left
                            </span>
                        )}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${isAtLimit ? "bg-red-500" : "bg-positive animate-pulse"}`} />
                            <span className="text-xs text-muted">{isAtLimit ? "Limited" : "Live"}</span>
                        </div>
                    </div>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">Ask me about this market</p>
                                <p className="text-muted text-xs mt-1">Probability drivers, news impact, trading signals…</p>
                            </div>
                            {tier === "free" && limit !== null && (
                                <p className="text-xs text-muted/60">{remaining} free message{remaining !== 1 ? "s" : ""} remaining today</p>
                            )}
                        </div>
                    ) : (
                        messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border shrink-0">
                    {isAtLimit ? (
                        <button
                            onClick={() => setShowUpgrade(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/30 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-all"
                        >
                            <Lock className="w-4 h-4" /> Upgrade for unlimited messages
                        </button>
                    ) : (
                        <div className="flex gap-3 items-end">
                            <textarea
                                ref={inputRef}
                                rows={1}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isStreaming ? "AI is thinking…" : "Ask about this market…"}
                                disabled={isStreaming}
                                className="flex-1 bg-white/5 border border-border rounded-xl px-4 py-3 text-white placeholder-muted text-sm outline-none focus:border-primary/60 resize-none transition-colors disabled:opacity-50 scrollbar-thin"
                                style={{ maxHeight: "120px" }}
                                onInput={e => {
                                    const t = e.target as HTMLTextAreaElement;
                                    t.style.height = "auto";
                                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                                }}
                            />
                            <button
                                onClick={() => sendMessage(input)}
                                disabled={!input.trim() || isStreaming}
                                className="bg-primary text-black p-3 rounded-xl hover:bg-primary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                            >
                                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
