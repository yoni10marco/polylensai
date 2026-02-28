"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Send, X, Bot, User } from "lucide-react";

export interface AIChatContext {
    marketPrice?: string | number;
    newsTitle?: string;
    impactScore?: number;
}

interface AIChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    context: AIChatContext;
}

interface Message {
    role: "user" | "ai";
    content: string;
}

export default function AIChatDrawer({ isOpen, onClose, context }: AIChatDrawerProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Init greeting based on context
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: "ai",
                    content: `Hello! I'm your Quant Analyst. I see you're looking at the news: "${context.newsTitle || "General Market"
                        }" with current market price at ${context.marketPrice || "Unknown"}. How can I help you analyze this?`,
                },
            ]);
        }
    }, [isOpen, context, messages.length]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        try {
            const response = await fetch("/api/analyze-news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isChat: true,
                    message: userMsg,
                    context: {
                        price: context.marketPrice,
                        news: context.newsTitle,
                        impactScore: context.impactScore
                    }
                }),
            });

            if (!response.ok) throw new Error("Failed response");

            const data = await response.json();
            setMessages((prev) => [...prev, { role: "ai", content: data.reply || "I encountered an error analyzing that." }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "ai", content: "Sorry, my systems are currently down. Check your API keys!" }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 w-[400px] bg-surface border-l border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-white">Quant Analyst AI</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-muted hover:text-white transition-colors rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Context Badge */}
                <div className="px-4 py-2 bg-primary/5 border-b border-primary/10">
                    <p className="text-xs text-muted line-clamp-1">
                        <span className="font-semibold text-primary/80">Context:</span> {context.newsTitle}
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-primary text-background font-medium rounded-tr-sm"
                                    : "bg-background border border-border text-gray-200 rounded-tl-sm"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-background border border-border p-3 rounded-2xl rounded-tl-sm text-primary flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-semibold tracking-wider uppercase">Analyzing...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-background">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask about strategies, probabilities..."
                            className="w-full bg-surface border border-border rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 p-1.5 bg-primary text-background rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
