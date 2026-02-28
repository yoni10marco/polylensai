import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Google Generative AI SDK
// It expects GEMINI_API_KEY in the environment variables
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: "Text is required for analysis." },
                { status: 400 }
            );
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        // Get the Gemini 1.5 Flash model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

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
