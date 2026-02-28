import Link from "next/link";
import { Sparkles, Activity, MessageSquare, ArrowRight, Zap, Target } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center overflow-x-hidden">
            {/* Navigation */}
            <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white shadow-sm">
                        PolyLens <span className="text-primary font-light">AI</span>
                    </span>
                </div>
                <div className="flex gap-4 items-center">
                    <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-white transition-colors">Log In</Link>
                    <Link href="/dashboard" className="text-sm font-semibold px-4 py-2 bg-primary text-background rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)]">
                        Launch App
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 w-full flex flex-col items-center">
                <section className="w-full max-w-5xl mx-auto px-6 py-32 flex flex-col items-center text-center relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-8">
                        <Zap className="w-3 h-3" />
                        Polymarket Alpha Tool
                    </div>

                    <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                        Trade with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-400 drop-shadow-sm">
                            AI-Powered Alpha.
                        </span>
                    </h1>
                    <p className="text-xl text-muted max-w-2xl mb-10 leading-relaxed">
                        Gain the ultimate edge in prediction markets. Real-time news sentiment, contextual AI chat, and dynamic lag detection signals.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 bg-primary text-background rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                            Start Trading <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="#features" className="px-8 py-4 bg-surface border border-border rounded-full font-medium text-white hover:bg-white/5 transition-colors">
                            View Features
                        </a>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-border/50">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Precision Institutional Tooling</h2>
                        <p className="text-muted max-w-xl mx-auto">Built for modern quants who rely on information asymmetry to beat the crowd.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass-panel p-8 relative overflow-hidden group hover:border-primary/40 transition-colors">
                            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Alpha Lag Detector</h3>
                            <p className="text-muted text-sm leading-relaxed">
                                Our system scans the delta between high-impact breaking news and the actual Polymarket token price, alerting you to market inefficiencies before they correct.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass-panel p-8 relative overflow-hidden group hover:border-primary/40 transition-colors">
                            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                                <MessageSquare className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Contextual AI Chat</h3>
                            <p className="text-muted text-sm leading-relaxed">
                                Don't just read the news. Ask our built-in Polymarket Quant Analyst how a specific headline affects Trump's swing state odds in real-time.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass-panel p-8 relative overflow-hidden group hover:border-primary/40 transition-colors">
                            <div className="bg-indigo-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Live Feed Parsing</h3>
                            <p className="text-muted text-sm leading-relaxed">
                                Say goodbye to doomscrolling Twitter. We instantly parse news, grade sentiment (1-10), and suggest concrete Yes/No trades.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="w-full max-w-7xl mx-auto px-6 py-24 mb-24">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">Transparent Pricing</h2>
                        <p className="text-muted max-w-xl mx-auto">Scale your edge. Upgrade or downgrade at any time.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
                        {/* Free Tier */}
                        <div className="glass-panel p-8 border border-border hover:border-white/20 transition-colors">
                            <h3 className="text-xl font-semibold text-white mb-2">Hobbyist</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-muted">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-sm text-muted">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/50"></div> 10 AI Analyzes per day</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/50"></div> End of Day Market Data</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/50"></div> standard UI access</li>
                            </ul>
                            <Link href="/dashboard" className="block text-center w-full py-3 bg-surface border border-border text-white rounded-md font-semibold hover:bg-white/5 transition-colors">
                                Begin Free
                            </Link>
                        </div>

                        {/* Pro Tier (Highlighted) */}
                        <div className="glass-panel p-8 border-2 border-primary relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(56,189,248,0.15)]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background rounded-full">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 text-primary">Pro Quant</h3>
                            <div className="mb-6">
                                <span className="text-5xl font-extrabold text-white">$29</span>
                                <span className="text-muted">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-sm text-gray-300">
                                <li className="flex items-center gap-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(56,189,248,0.8)]"></div> Unlimited AI Analysis</li>
                                <li className="flex items-center gap-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(56,189,248,0.8)]"></div> Real-time Market CLOB Data</li>
                                <li className="flex items-center gap-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(56,189,248,0.8)]"></div> Contextual AI Chat Drawer</li>
                            </ul>
                            <Link href="/dashboard" className="block text-center w-full py-3 bg-primary text-background rounded-md font-bold hover:opacity-90 transition-opacity">
                                Upgrade to Pro
                            </Link>
                        </div>

                        {/* Ultra Tier */}
                        <div className="glass-panel p-8 border border-border hover:border-white/20 transition-colors">
                            <h3 className="text-xl font-semibold text-white mb-2">Institution</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$79</span>
                                <span className="text-muted">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-sm text-muted">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> All Pro Features</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> API Access & Webhooks</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Custom Model Personas</li>
                            </ul>
                            <Link href="/dashboard" className="block text-center w-full py-3 bg-surface border border-border text-white rounded-md font-semibold hover:bg-white/5 transition-colors">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="w-full py-8 border-t border-border/50 text-center text-sm text-muted">
                <p>&copy; 2026 PolyLens AI. All rights reserved.</p>
            </footer>
        </div>
    );
}
