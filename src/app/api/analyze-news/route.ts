import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Google Generative AI SDK
// It expects GEMINI_API_KEY in the environment variables
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { text, isChat, message, context } = payload;

        if (!text && !isChat) {
            return NextResponse.json(
                { error: "Text or chat message is required for analysis." },
                { status: 400 }
            );
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        // Get the Gemini 2.5 Flash model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
        });

        if (isChat) {
            const chatPrompt = `System Instruction: You are a Polymarket Quant Analyst consulting with a user.
Context about current market:
Market Price: ${context?.price || "Unknown"}
Related News Headline: "${context?.news || "None"}"
Recent API Impact Score (if any): ${context?.impactScore || "N/A"}/10

User Message: "${message}"

Respond to the user directly, advising them on trading strategies, context, or market implications. Keep your answer brief, insightful, plain text (no markdown json blocks), as if advising a client on a Bloomberg chat terminal.`;
            const result = await model.generateContent(chatPrompt);
            return NextResponse.json({ reply: result.response.text().trim() });
        }

        const prompt = `System Instruction: You are a Polymarket Quant Analyst. 
Your job is to analyze news headlines or short content and determine their potential impact on active political and financial markets.
You must respond with a perfectly valid JSON object in the following format:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "impact_score": <number between 1 and 10>,
  "reasoning": "<short 1-2 sentence explanation of why this impacts the market>",
  "suggested_trade": "Yes" | "No" | "Wait"
}
Do not include any other text or markdown block backticks outside the JSON. Return only the JSON object.

News to analyze: "${text}"`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up potential markdown formatting if the model still outputs it
        const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();

        // Parse the JSON representation
        const analysis = JSON.parse(cleanedText);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Gemini AI Analysis Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze text using AI." },
            { status: 500 }
        );
    }
}
