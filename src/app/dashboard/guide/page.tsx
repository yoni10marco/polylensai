"use client";

import Link from "next/link";
import {
    Activity,
    AlertTriangle,
    BarChart2,
    BookOpen,
    Bot,
    Clock,
    MessageSquare,
    TrendingUp,
    Zap,
} from "lucide-react";

// ─── Section metadata ──────────────────────────────────────────────────────────
const SECTIONS = [
    {
        id: "probability-history",
        icon: TrendingUp,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        glow: "shadow-[0_0_20px_rgba(0,229,255,0.08)]",
        title: "Probability History",
        badge: "Real-time Data",
        summary:
            "The probability chart shows the likelihood of a market resolving 'Yes', expressed as a percentage (0–100%). This data is sourced directly from Polymarket's Central Limit Order Book (CLOB).",
        detail: [
            "Every data point represents the mid-price of the best Yes bid and the best Yes offer at that moment, converted to a probability percentage.",
            "When the chart trends upward, it means the crowd is placing higher value on the Yes outcome — signaling increasing conviction that the event will happen.",
            "Downward trends indicate sentiment shifting toward No. Flat lines (low volatility) are where the Lag Detector becomes particularly useful.",
        ],
        example: {
            label: "Example reading",
            value: "55.2%",
            desc: "The market currently prices 'Yes' at 55.2%, meaning the crowd believes there is a 55% chance this event will happen.",
        },
    },
    {
        id: "ai-sentiment",
        icon: Bot,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        glow: "shadow-[0_0_20px_rgba(96,165,250,0.08)]",
        title: "AI Sentiment Analysis",
        badge: "Powered by Gemini",
        summary:
            "Every news headline associated with a market is automatically analyzed by Google's Gemini model. The result is a structured sentiment score that tells you whether the news is likely to push the probability up or down.",
        detail: [
            "Sentiment is classified as Positive (news likely raises the Yes probability), Negative (news likely lowers it), or Neutral (not directionally significant).",
            "The model is prompted with the specific market question as context, so sentiment is always relative to the market's outcome — not just generically positive or negative.",
            "Sentiment is recalculated each time a new news batch is fetched, ensuring freshness.",
        ],
        example: {
            label: "Example output",
            value: "Positive",
            desc: "A headline about Trump gaining 4 points in swing-state polls is tagged Positive for a 'Trump wins 2024' market.",
        },
    },
    {
        id: "impact-weight",
        icon: Zap,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        glow: "shadow-[0_0_20px_rgba(250,204,21,0.08)]",
        title: "Impact Weight",
        badge: "1 – 10 Score",
        summary:
            "Beyond sentiment direction, Impact Weight measures the magnitude of a news event's expected effect on market probability. A score of 10 means transformative — a score of 1 means negligible noise.",
        detail: [
            "The score is derived from the AI analysing factors like: Is this a primary source (legislation, official statement) or a secondary commentary? How closely does the headline relate to the market's core resolution criteria? Is this a surprise or an already-priced event?",
            "Scores of 7–10 are treated as High Impact and are the primary input to the Lag Detector.",
            "Scores of 1–3 are categorised as Noise and are filtered from the alpha signal pipeline.",
        ],
        example: {
            label: "Example score",
            value: "8 / 10",
            desc: "An official central bank press release is scored 8 for a 'Fed rate cut by June' market — high impact because it directly references resolution criteria.",
        },
    },
    {
        id: "lag-detector",
        icon: AlertTriangle,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        glow: "shadow-[0_0_20px_rgba(0,229,255,0.08)]",
        title: "Lag Detector",
        badge: "Alpha Signal",
        summary:
            "The Lag Detector is PolyLens AI's core alpha signal. It identifies moments where high-impact news has been published but the market probability has not yet moved to reflect it — a window of potential inefficiency.",
        detail: [
            "The logic compares the last 5 probability data points. If the total movement (delta) is less than 2%, the market is considered stagnant.",
            "Signal strength is classified in three tiers: Weak (1.2–2% delta), Moderate (0.5–1.2%), and Strong (<0.5% — nearly flat despite news).",
            "A Strong signal triggers a glowing alert panel with a pulsing ring icon. This does NOT constitute financial advice — it is an informational flag that the market may be slow to reprice.",
            "Prediction markets are known to have latency between information arrival and price discovery. This detector is designed to surface that latency.",
        ],
        example: {
            label: "Example trigger",
            value: "Δ 0.3%",
            desc: "The probability moved only 0.3% over the last 5 data points after a major court ruling was published — Lag Detector fires at Strong.",
        },
    },
    {
        id: "ai-chat",
        icon: MessageSquare,
        color: "text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        glow: "shadow-[0_0_20px_rgba(129,140,248,0.08)]",
        title: "Contextual AI Chat",
        badge: "Gemini 2.5 Flash + Search",
        summary:
            "Each market detail page includes an AI chat powered by Gemini 2.5 Flash with Google Search grounding. The AI is not a generic chatbot — it operates with full knowledge of the specific market you are viewing.",
        detail: [
            "The system prompt injects the market question, current probability, and a summary of recent price history (direction, delta, range) before every conversation session.",
            "Google Search grounding enables the model to retrieve live web information about the topic, so its reasoning is based on current events rather than just training data.",
            "The AI follows a structured analytical framework: trend analysis → causal reasoning → risk factors → market efficiency assessment.",
            "Multi-turn conversation history is maintained for the session, so you can ask follow-up questions and receive contextually coherent answers.",
            "Responses are streamed token-by-token for a natural reading experience.",
        ],
        example: {
            label: "Example prompt",
            value: '"Why is the probability falling?"',
            desc: "The AI synthesises the price trend direction, Google Search results for recent news, and the market question to give a grounded, specific answer.",
        },
    },
];

// ─── Internal sidebar ──────────────────────────────────────────────────────────
function GuideSidebar() {
    return (
        <nav className="hidden xl:flex flex-col gap-1 w-56 shrink-0">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3 px-3">On This Page</p>
            {SECTIONS.map((s) => (
                <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-colors group"
                >
                    <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
                    <span className="leading-tight">{s.title}</span>
                </a>
            ))}
            <div className="mt-6 px-3">
                <Link
                    href="/dashboard/markets"
                    className="flex items-center gap-2 text-xs text-primary/70 hover:text-primary transition-colors"
                >
                    ← Back to Markets
                </Link>
            </div>
        </nav>
    );
}

// ─── Single section card ───────────────────────────────────────────────────────
function SectionCard({ section }: { section: typeof SECTIONS[number] }) {
    const Icon = section.icon;
    return (
        <section id={section.id} className={`glass-panel p-7 md:p-10 ${section.glow}`}>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className={`${section.bg} border ${section.border} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-none">{section.title}</h2>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${section.color} mt-1 block`}>
                        {section.badge}
                    </span>
                </div>
            </div>

            {/* Summary */}
            <p className="text-gray-300 text-base leading-relaxed mb-6">{section.summary}</p>

            {/* Detail bullets */}
            <ul className="space-y-3 mb-8">
                {section.detail.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
                        <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${section.bg} border ${section.border} ${section.color}`} />
                        {point}
                    </li>
                ))}
            </ul>

            {/* Example card */}
            <div className={`${section.bg} border ${section.border} rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
                <div className="shrink-0">
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">{section.example.label}</p>
                    <p className={`text-2xl font-extrabold ${section.color}`}>{section.example.value}</p>
                </div>
                <div className="sm:border-l sm:border-white/10 sm:pl-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{section.example.desc}</p>
                </div>
            </div>
        </section>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DataGuidePage() {
    return (
        <div className="flex flex-col gap-6 pb-12 w-full">
            {/* Page header */}
            <div className="glass-panel p-7 md:p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/15 border border-primary/30 p-3 rounded-xl">
                            <BookOpen className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Data & Methodology Guide</h1>
                            <p className="text-primary/70 text-sm font-semibold uppercase tracking-widest mt-0.5">PolyLens Intelligence Suite</p>
                        </div>
                    </div>
                    <p className="text-gray-400 text-base max-w-2xl leading-relaxed">
                        Every metric you see on PolyLens AI is grounded in transparent, reproducible methodology.
                        This guide explains exactly what each data point means, where it comes from, and how to use it to make better decisions.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                        {SECTIONS.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${s.bg} border ${s.border} ${s.color} hover:opacity-80 transition-opacity`}
                            >
                                <s.icon className="w-3 h-3" />
                                {s.title}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Body — sticky sidebar + sections */}
            <div className="flex gap-8 items-start">
                {/* Sticky sidebar */}
                <div className="sticky top-6">
                    <GuideSidebar />
                </div>

                {/* Section cards */}
                <div className="flex-1 min-w-0 flex flex-col gap-8">
                    {SECTIONS.map((s) => (
                        <SectionCard key={s.id} section={s} />
                    ))}

                    {/* Footer note */}
                    <div className="glass-panel p-6 flex items-start gap-4 border-yellow-500/20 bg-yellow-500/5">
                        <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-300 mb-1">Disclaimer</p>
                            <p className="text-sm text-muted leading-relaxed">
                                PolyLens AI is an information and analytics tool. Nothing on this platform constitutes financial advice.
                                All signals, scores, and AI-generated content are for informational and educational purposes only.
                                Prediction market trading carries risk — always conduct your own research.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
