import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { message, history = [], marketContext } = body;

        if (!message) {
            return NextResponse.json({ error: "message is required" }, { status: 400 });
        }

        const { title = "Unknown Market", probability = "N/A", headlines = [] } = marketContext || {};

        const headlineBlock = headlines.length > 0
            ? `\nRecent News Headlines:\n${headlines.map((h: string, i: number) => `  ${i + 1}. ${h}`).join("\n")}`
            : "\nRecent News Headlines: None available.";

        const systemInstruction = `You are PolyLens AI, an expert Prediction Market Analyst specializing in Polymarket.
You are currently helping a user analyze the following specific market:

Market Question: "${title}"
Current Market Probability (Yes): ${probability}%${headlineBlock}

Your role:
- Provide neutral, data-driven insights grounded in the context above.
- Explain probability movements, risks, and catalysts concisely.
- Reference the specific market question and probability in your answers.
- Never give financial advice or recommendations to buy/sell.
- Keep responses concise (2-4 paragraphs max) and use plain text, no markdown tables.
- If asked something unrelated to prediction markets or this specific market, gently redirect.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
        });

        // Build conversation history for multi-turn chat
        const formattedHistory = history.map((msg: { role: string; text: string }) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        }));

        const chat = model.startChat({ history: formattedHistory });

        // Use streaming for progressive token delivery
        const streamResult = await chat.sendMessageStream(message);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamResult.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
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
