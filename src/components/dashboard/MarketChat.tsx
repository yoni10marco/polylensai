"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, User, Send, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
    streaming?: boolean;
}

interface MarketContext {
    title: string;
    probability: string;
    headlines?: string[];
    priceHistory?: { time: string; price: number }[];
}

interface MarketChatProps {
    marketContext: MarketContext;
    conditionId: string; // needed to scope chat history per market
}

const QUICK_STARTS = [
    "Why is the probability shifting?",
    "What are the main risks for Yes?",
    "Summarize this market briefly.",
    "What news is driving this?",
];

export default function MarketChat({ marketContext, conditionId }: MarketChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const supabase = createClient();

    // Load chat history on mount
    useEffect(() => {
        async function loadHistory() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setHistoryLoaded(true); return; }

            const { data, error } = await supabase
                .from("chat_history")
                .select("id, role, content, created_at")
                .eq("user_id", user.id)
                .eq("condition_id", conditionId)
                .order("created_at", { ascending: true })
                .limit(40);

            if (error) {
                console.warn("[MarketChat] Failed to load history:", error.message, error.code);
                setDbErrorMsg(`Load error [${error.code}]: ${error.message}`);
            } else if (data) {
                setMessages(data.map((row: any) => ({
                    id: row.id,
                    role: row.role as "user" | "assistant",
                    text: row.content,
                })));
            }
            setHistoryLoaded(true);
        }
        loadHistory();
    }, [conditionId]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function persistMessage(role: "user" | "assistant", content: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from("chat_history").insert({
            user_id: user.id,
            condition_id: conditionId,
            role,
            content,
        });
        if (error) {
            console.warn("[MarketChat] Failed to persist message:", error.message, error.code);
            setDbErrorMsg(`Save error [${error.code}]: ${error.message}`);
        }
    }

    async function sendMessage(text: string) {
        if (!text.trim() || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            text: text.trim(),
        };
        const assistantId = (Date.now() + 1).toString();
        const assistantPlaceholder: Message = { id: assistantId, role: "assistant", text: "", streaming: true };

        setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
        setInput("");
        setIsStreaming(true);

        const history = messages.map((m) => ({ role: m.role, text: m.text }));

        try {
            const res = await fetch("/api/market-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    history,
                    marketContext: {
                        ...marketContext,
                        priceHistory: marketContext.priceHistory?.slice(-10) ?? [],
                    },
                }),
            });

            if (!res.ok || !res.body) throw new Error("Stream failed");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulated += decoder.decode(value, { stream: true });
                setMessages((prev) =>
                    prev.map((m) => m.id === assistantId ? { ...m, text: accumulated, streaming: true } : m)
                );
            }

            setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, text: accumulated, streaming: false } : m)
            );

            // Persist both turns after stream completes
            await persistMessage("user", text.trim());
            await persistMessage("assistant", accumulated);

        } catch (err) {
            console.error("[MarketChat] Stream error:", err);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, text: "Sorry, I couldn't generate a response. Please try again.", streaming: false }
                        : m
                )
            );
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

    return (
        <div className="glass-panel flex flex-col" style={{ height: "480px" }}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
                <div className="bg-primary/20 p-1.5 rounded-full">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-white text-sm leading-none">AI Market Chat</h3>
                    <p className="text-xs text-muted mt-0.5">
                        {dbErrorMsg ? "History unavailable — DB error" : "Powered by Gemini 2.5 Flash · History synced"}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
                    <span className="text-xs text-muted">Live</span>
                </div>
            </div>

            {/* DB error banner — shows actual Supabase error for debugging */}
            {dbErrorMsg && (
                <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed shrink-0 font-mono">
                    ⚠️ {dbErrorMsg}
                </div>
            )}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {!historyLoaded ? (
                    <div className="flex flex-col gap-3 py-4">
                        {[70, 90, 60].map((w, i) => (
                            <div key={i} className={`h-10 bg-white/5 rounded-xl animate-pulse ${i % 2 === 1 ? "ml-auto" : ""}`} style={{ width: `${w}%` }} />
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <EmptyState
                        marketTitle={marketContext.title}
                        onQuickStart={(q) => sendMessage(q)}
                        disabled={isStreaming}
                    />
                ) : (
                    <>
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Quick starts (persistent) */}
            {historyLoaded && messages.length > 0 && !isStreaming && (
                <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
                    {QUICK_STARTS.slice(0, 2).map((q) => (
                        <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="text-xs px-2 py-1 rounded-full bg-white/5 border border-border text-muted hover:border-primary/50 hover:text-primary transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
                <div className="flex gap-2 items-end bg-white/5 border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this market…"
                        disabled={isStreaming}
                        className="flex-1 bg-transparent text-white text-sm placeholder-muted resize-none outline-none max-h-24 leading-relaxed"
                        style={{ scrollbarWidth: "none" }}
                    />
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={isStreaming || !input.trim()}
                        className="shrink-0 p-1.5 rounded-lg bg-primary text-black font-bold hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs text-muted/50 mt-1 text-center">Press Enter to send · Shift+Enter for new line</p>
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";
    return (
        <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? "bg-primary/20" : "bg-white/10"}`}>
                {isUser ? <User className="w-3.5 h-3.5 text-primary" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser
                ? "bg-primary/20 text-white border border-primary/30 rounded-tr-sm"
                : "bg-white/5 text-gray-200 border border-border rounded-tl-sm"}`}
            >
                {message.text || (
                    <span className="flex items-center gap-2 text-muted">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Thinking…
                    </span>
                )}
                {message.streaming && message.text && (
                    <span className="inline-block w-1 h-3.5 bg-primary ml-0.5 animate-pulse rounded-sm align-middle" />
                )}
            </div>
        </div>
    );
}

function EmptyState({ marketTitle, onQuickStart, disabled }: { marketTitle: string; onQuickStart: (q: string) => void; disabled: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-5 py-4">
            <div className="bg-primary/10 border border-primary/20 rounded-full p-4">
                <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-1 px-4">
                <p className="text-white font-semibold text-sm">Ask me anything about this market</p>
                <p className="text-muted text-xs leading-relaxed line-clamp-2">{marketTitle}</p>
            </div>
            <div className="flex flex-col gap-2 w-full px-2">
                {QUICK_STARTS.map((q) => (
                    <button
                        key={q}
                        onClick={() => onQuickStart(q)}
                        disabled={disabled}
                        className="text-left text-xs px-3 py-2 rounded-lg bg-white/5 border border-border text-gray-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="text-primary mr-2">→</span>{q}
                    </button>
                ))}
            </div>
        </div>
    );
}
