import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

interface PricePoint { time: string; price: number; }

function buildTrendSummary(history: PricePoint[]): string {
    if (!history || history.length < 2) return "No historical trend data available.";
    const recent = history.slice(-10); // last 10 data points
    const first = recent[0].price;
    const last = recent[recent.length - 1].price;
    const delta = (last - first).toFixed(1);
    const direction = last > first ? "rising" : last < first ? "falling" : "stable";
    const minP = Math.min(...recent.map(p => p.price)).toFixed(1);
    const maxP = Math.max(...recent.map(p => p.price)).toFixed(1);
    const points = recent.map(p => `${p.time}: ${p.price}%`).join(", ");
    return `Trend: ${direction} (${delta > "0" ? "+" : ""}${delta}% over last ${recent.length} data points). Range: ${minP}%–${maxP}%. Data: [${points}]`;
}

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
        }

        const body = await req.json();
        const { message, history = [], marketContext } = body;

        if (!message) {
            return NextResponse.json({ error: "message is required" }, { status: 400 });
        }

        const {
            title = "Unknown Market",
            probability = "N/A",
            headlines = [] as string[],
            priceHistory = [] as PricePoint[],
        } = marketContext || {};

        const trendSummary = buildTrendSummary(priceHistory);
        const headlineBlock = headlines.length > 0
            ? `\nRecent News Headlines:\n${headlines.map((h: string, i: number) => `  ${i + 1}. ${h}`).join("\n")}`
            : "";

        const systemInstruction = `You are PolyLens AI, an expert Prediction Market Analyst specializing in Polymarket.
You are currently helping a user analyze the following specific market:

Market Question: "${title}"
Current Market Probability (Yes): ${probability}%
Historical Price ${trendSummary}${headlineBlock}

Your analytical framework:
1. TREND ANALYSIS: Explain what the price trajectory (rising/falling/stable) signals about market sentiment.
2. CAUSAL REASONING: Use your knowledge and web search to identify what real-world events, news, or political developments are driving this probability.
3. RISK FACTORS: Identify the key upside and downside risks that could shift the probability significantly.
4. MARKET EFFICIENCY: Note if the current probability seems over- or under-priced relative to available information.

Rules:
- Be concrete and specific — reference the actual probability number and trend direction.
- Never give financial advice or say "you should trade/buy/sell."
- Keep responses concise (3–5 short paragraphs). Use plain text, no markdown headers or bullet lists.
- If you use web search results, synthesize them naturally without listing sources.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
            tools: [{ googleSearch: {} }],
        } as any);

        const formattedHistory = history.map((msg: { role: string; text: string }) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        }));

        const chat = model.startChat({ history: formattedHistory });
        const streamResult = await chat.sendMessageStream(message);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamResult.stream) {
                        const text = chunk.text();
                        if (text) controller.enqueue(encoder.encode(text));
                    }
                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("[market-chat] Error:", error);
        return NextResponse.json({ error: "Failed to generate AI response." }, { status: 500 });
    }
}
