import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Service-role free client (anon key is fine for public-write cache table with permissive policy)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CACHE_TTL_HOURS = 24;

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { text, news_id, isChat, message, context } = payload;

        if (!text && !isChat) {
            return NextResponse.json({ error: "Text is required." }, { status: 400 });
        }
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
        }

        // ── Chat mode (not cached) ─────────────────────────────────────────────
        if (isChat) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const chatPrompt = `System Instruction: You are a Polymarket Quant Analyst consulting with a user.
Context about current market:
Market Price: ${context?.price || "Unknown"}
Related News Headline: "${context?.news || "None"}"
Recent API Impact Score (if any): ${context?.impactScore || "N/A"}/10

User Message: "${message}"

Respond to the user directly. Keep your answer brief, insightful, plain text (no markdown), as if advising a client on a Bloomberg terminal.`;
            const result = await model.generateContent(chatPrompt);
            return NextResponse.json({ reply: result.response.text().trim() });
        }

        // ── Analysis mode — check DB cache first ─────────────────────────────
        const cacheKey = news_id || text.slice(0, 120); // use news_id if provided, else truncated headline

        const { data: cached } = await supabase
            .from("news_analyses")
            .select("sentiment, impact_weight, summary, analyzed_at")
            .eq("news_id", cacheKey)
            .single();

        if (cached) {
            const ageHours = (Date.now() - new Date(cached.analyzed_at).getTime()) / 3_600_000;
            if (ageHours < CACHE_TTL_HOURS) {
                return NextResponse.json({
                    sentiment: cached.sentiment,
                    impact_score: cached.impact_weight,
                    reasoning: cached.summary,
                    suggested_trade: "Wait",
                    cached: true,
                });
            }
        }

        // ── Cache miss — call Gemini ─────────────────────────────────────────
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const prompt = `System Instruction: You are a Polymarket Quant Analyst.
Analyze the following news headline and respond with a valid JSON object ONLY:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "impact_score": <number 1-10>,
  "reasoning": "<1-2 sentence explanation>",
  "suggested_trade": "Yes" | "No" | "Wait"
}
Do not include markdown or extra text. Return only the JSON object.

News: "${text}"`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
        const analysis = JSON.parse(rawText);

        // ── Persist to cache table ────────────────────────────────────────────
        await supabase.from("news_analyses").upsert({
            news_id: cacheKey,
            headline: text.slice(0, 500),
            sentiment: analysis.sentiment,
            impact_weight: analysis.impact_score,
            summary: analysis.reasoning,
            analyzed_at: new Date().toISOString(),
        }, { onConflict: "news_id" });

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Gemini AI Analysis Error:", error);
        return NextResponse.json({ error: "Failed to analyze text using AI." }, { status: 500 });
    }
}
