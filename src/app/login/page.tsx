"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Zap, BarChart2, Bot } from "lucide-react";

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/dashboard";

    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push(redirect);
                router.refresh();
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess("Account created! Check your email to confirm, then log in.");
                setMode("login");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050810] flex">
            {/* Left — branding panel */}
            <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 border-r border-white/5 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/5 pointer-events-none" />
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                <div className="relative">
                    <div className="flex items-center gap-2.5 mb-12">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_#00e5ff]" />
                        <span className="text-xl font-bold text-white tracking-wider">PolyLens AI</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Prediction Market<br />
                        <span className="text-primary">Intelligence</span>
                    </h1>
                    <p className="text-gray-400 leading-relaxed max-w-xs">
                        Real-time probability analytics, AI-powered sentiment analysis, and lag detection for Polymarket traders.
                    </p>
                </div>

                <div className="relative space-y-5">
                    {[
                        { icon: BarChart2, title: "Live Probability Charts", desc: "Direct from Polymarket's CLOB" },
                        { icon: Bot, title: "Gemini 2.5 Flash AI", desc: "Context-aware market analysis" },
                        { icon: Zap, title: "Lag Detector", desc: "Find inefficiency alpha signals" },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg shrink-0">
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{title}</p>
                                <p className="text-muted text-xs">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right — auth form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#00e5ff]" />
                        <span className="text-lg font-bold text-white">PolyLens AI</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">
                        {mode === "login" ? "Welcome back" : "Create account"}
                    </h2>
                    <p className="text-muted text-sm mb-8">
                        {mode === "login"
                            ? "Sign in to your PolyLens account"
                            : "Start your free PolyLens account"}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-white placeholder-muted text-sm outline-none focus:border-primary/60 focus:bg-white/8 transition-colors"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 pr-11 text-white placeholder-muted text-sm outline-none focus:border-primary/60 focus:bg-white/8 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error / Success */}
                        {error && (
                            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-sm text-positive bg-positive/10 border border-positive/20 rounded-lg px-4 py-3">
                                {success}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.25)]"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> {mode === "login" ? "Signing in…" : "Creating account…"}</>
                            ) : (
                                mode === "login" ? "Sign In" : "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <p className="text-center text-sm text-muted mt-6">
                        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
                            className="text-primary font-semibold hover:text-primary/80 transition-colors"
                        >
                            {mode === "login" ? "Sign up free" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
