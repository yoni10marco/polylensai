"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, User, Send, Sparkles, Loader2, MessageSquare } from "lucide-react";

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
}

interface MarketChatProps {
    marketContext: MarketContext;
}

const QUICK_STARTS = [
    "Why is the probability shifting?",
    "What are the main risks for Yes?",
    "Summarize this market briefly.",
    "What news is driving this?",
];

export default function MarketChat({ marketContext }: MarketChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(text: string) {
        if (!text.trim() || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            text: text.trim(),
        };

        const assistantId = (Date.now() + 1).toString();
        const assistantPlaceholder: Message = {
            id: assistantId,
            role: "assistant",
            text: "",
            streaming: true,
        };

        const newMessages = [...messages, userMessage, assistantPlaceholder];
        setMessages(newMessages);
        setInput("");
        setIsStreaming(true);

        // Build history excluding the new assistant placeholder
        const history = messages.map((m) => ({ role: m.role, text: m.text }));

        try {
            const res = await fetch("/api/market-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    history,
                    marketContext,
                }),
            });

            if (!res.ok || !res.body) {
                throw new Error("Stream failed");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, text: accumulated, streaming: true } : m
                    )
                );
            }

            // Mark streaming as done
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId ? { ...m, text: accumulated, streaming: false } : m
                )
            );
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
                    <p className="text-xs text-muted mt-0.5">Powered by Gemini 2.5 Flash</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
                    <span className="text-xs text-muted">Live</span>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 ? (
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

            {/* Quick starts (shown when there are messages too) */}
            {messages.length > 0 && !isStreaming && (
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
                        {isStreaming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
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
            {/* Avatar */}
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? "bg-primary/20" : "bg-white/10"}`}>
                {isUser ? (
                    <User className="w-3.5 h-3.5 text-primary" />
                ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                )}
            </div>

            {/* Bubble */}
            <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser
                        ? "bg-primary/20 text-white border border-primary/30 rounded-tr-sm"
                        : "bg-white/5 text-gray-200 border border-border rounded-tl-sm"
                    }`}
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

function EmptyState({
    marketTitle,
    onQuickStart,
    disabled,
}: {
    marketTitle: string;
    onQuickStart: (q: string) => void;
    disabled: boolean;
}) {
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
