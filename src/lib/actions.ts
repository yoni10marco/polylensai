"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";


const VALID_CATEGORIES = [
    'Politics', 'Crypto', 'Sports', 'Pop Culture',
    'Business', 'Science', 'Entertainment', 'Weather', 'Social Media'
] as const;

function formatVolume(vol: string | number | undefined): string {
    const num = Number(vol);
    if (!vol || isNaN(num) || num === 0) return "$0";
    return new Intl.NumberFormat('en-US', {
        notation: "compact",
        compactDisplay: "short",
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 1
    }).format(num);
}

function getProbability(outcomePrices: string | undefined): string {
    if (!outcomePrices) return "N/A";
    try {
        const prices: string[] = JSON.parse(outcomePrices);
        if (!prices || prices.length === 0) return "N/A";
        const p = parseFloat(prices[0]);
        if (isNaN(p)) return "N/A";
        return (p * 100).toFixed(1);
    } catch {
        return "N/A";
    }
}

function getCategory(tags: Array<{ label?: string; slug?: string }> | undefined, title = "", groupTitle = ""): string {
    const haystack = [
        ...(tags || []).map(t => t.label || t.slug || ""),
        title,
        groupTitle,
    ].join(" ").toLowerCase();

    const RULES: Array<[string, string]> = [
        ["crypto|bitcoin|ethereum|defi|nft|blockchain|solana|doge|xrp", "Crypto"],
        ["politic|election|vote|congress|senate|president|white house|biden|trump|democrat|republican", "Politics"],
        ["sport|nba|nfl|mlb|nhl|soccer|football|basketball|baseball|tennis|golf|ufc|mma|olympic", "Sports"],
        ["weather|hurricane|tornado|earthquake|flood|climate|storm", "Weather"],
        ["twitter|x\.com|social media|tiktok|instagram|youtube|facebook|reddit|elon musk tweet", "Social Media"],
        ["entertain|movie|film|award|oscar|emmy|grammy|music|celebrity|box office|taylor swift|beyonce", "Entertainment"],
        ["science|ai|artificial intelligence|spacex|nasa|space|research|study|health|vaccine|gene", "Science"],
        ["business|economy|stock|market|gdp|fed|inflation|interest rate|earnings|ipo|merger", "Business"],
        ["pop culture|celebrity|kardashian|reality tv|superbowl halftime", "Pop Culture"],
    ];

    for (const [pattern, category] of RULES) {
        if (new RegExp(pattern).test(haystack)) return category;
    }
    return "Other";
}

export async function fetchActiveMarketsAction(limit = 200) {
    try {
        console.log(`[fetchActiveMarketsAction] Fetching events from Gamma API... limit=${limit}`);

        // Use /events endpoint which returns active, open markets with real volume data
        const url = `https://gamma-api.polymarket.com/events?active=true&closed=false&archived=false&limit=${limit}&order=volume24hr&dir=desc`;
        const res = await fetch(url, { next: { revalidate: 60 } });

        if (!res.ok) {
            console.error(`[fetchActiveMarketsAction] API Error: ${res.status} ${res.statusText}`);
            return [];
        }

        const events = await res.json();

        if (!Array.isArray(events)) {
            console.error("[fetchActiveMarketsAction] Unexpected response format (not an array):", typeof events);
            return [];
        }

        console.log(`[fetchActiveMarketsAction] Fetched ${events.length} events.`);

        // Flatten: each event has a markets[] array. We take the FIRST market from each event
        // as the "primary" market for display purposes (the main Yes/No question)
        const mappedMarkets = events.flatMap((event: any) => {
            if (!event.markets || !Array.isArray(event.markets)) return [];

            // Sort markets: prefer ones with real volume, pick the one with highest volumeNum
            const sortedMarkets = [...event.markets].sort((a: any, b: any) =>
                (parseFloat(b.volume || "0") - parseFloat(a.volume || "0"))
            );

            // Take max 1 market per event to avoid flooding the grid with duplicates
            return sortedMarkets.slice(0, 1).map((market: any) => ({
                id: market.conditionId,
                conditionId: market.conditionId,
                title: event.title || market.question || "Unknown Market",
                question: market.question,
                category: getCategory(event.tags, event.title || "", event.groupItemTitle || ""),
                probability: getProbability(market.outcomePrices),
                probabilityNum: (() => { try { const p = JSON.parse(market.outcomePrices || '[]'); return parseFloat(p[0]) * 100 || 0; } catch { return 0; } })(),
                volume: formatVolume(market.volume || event.volume),
                volumeNum: parseFloat(market.volume || event.volume || '0'),
                volume24hr: formatVolume(event.volume24hr),
                volume24hrNum: parseFloat(event.volume24hr || '0'),
                image: event.image || market.image || "",
                sentiment: Math.random() > 0.5 ? "Positive" : "Negative",
                slug: market.slug || event.slug,
                endDate: market.endDateIso || event.endDate,
                startDate: event.startDate || market.startDate,
            }));
        });

        console.log(`[fetchActiveMarketsAction] Mapped ${mappedMarkets.length} markets before filtering.`);

        const now = Date.now();
        const liveMarkets = mappedMarkets.filter((m: any) => {
            // Drop markets whose endDate has already passed
            if (m.endDate) {
                const end = new Date(m.endDate).getTime();
                if (!isNaN(end) && end < now) return false;
            }
            // Drop effectively dead markets (no probability + no volume)
            if (m.probability === "N/A" && m.volume === "$0") return false;
            return true;
        });

        console.log(`[fetchActiveMarketsAction] Returning ${liveMarkets.length} live markets.`);
        return liveMarkets;
    } catch (error) {
        console.error("[fetchActiveMarketsAction] Failed:", error);
        return [];
    }
}

export async function fetchMarketByConditionId(conditionId: string) {
    try {
        // The /markets?condition_id= param is silently ignored by the Gamma API.
        // Instead, we fetch active events and search through nested markets for
        // the one whose conditionId matches.
        const res = await fetch(
            `https://gamma-api.polymarket.com/events?active=true&closed=false&archived=false&limit=200&order=volume24hr&dir=desc`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return null;
        const events = await res.json();
        if (!Array.isArray(events)) return null;

        let market: any = null;
        let parentEvent: any = null;

        for (const event of events) {
            if (!Array.isArray(event.markets)) continue;
            const found = event.markets.find((m: any) => m.conditionId === conditionId);
            if (found) {
                market = found;
                parentEvent = event;
                break;
            }
        }

        if (!market) {
            console.warn(`[fetchMarketByConditionId] conditionId ${conditionId} not found in active events.`);
            return null;
        }

        console.log(`[fetchMarketByConditionId] Found market: ${market.question || parentEvent?.title}`);
        return {
            id: market.conditionId,
            conditionId: market.conditionId,
            title: parentEvent?.title || market.question || "Unknown Market",
            question: market.question || "",
            probability: getProbability(market.outcomePrices),
            volume: formatVolume(market.volume || parentEvent?.volume),
            volume24hr: formatVolume(market.volume24hr || parentEvent?.volume24hr),
            image: parentEvent?.image || market.image || "",
            outcomes: (() => {
                try { return JSON.parse(market.outcomes || "[]"); } catch { return []; }
            })(),
            outcomePrices: (() => {
                try {
                    const prices = JSON.parse(market.outcomePrices || "[]");
                    return prices.map((p: string) => (parseFloat(p) * 100).toFixed(1));
                } catch { return []; }
            })(),
            clobTokenIds: market.clobTokenIds,
            endDate: market.endDateIso || parentEvent?.endDate,
            slug: market.slug || parentEvent?.slug,
        };
    } catch (error) {
        console.error("[fetchMarketByConditionId] Failed:", error);
        return null;
    }
}

export async function fetchMarketPriceHistoryAction(conditionId: string) {
    try {
        console.log(`[fetchMarketHistoryAction] Resolving token ID for condition: ${conditionId}`);

        // Same fix: /markets?condition_id= is ignored; search events instead.
        const gammaRes = await fetch(
            `https://gamma-api.polymarket.com/events?active=true&closed=false&archived=false&limit=200&order=volume24hr&dir=desc`,
            { next: { revalidate: 60 } }
        );
        if (!gammaRes.ok) throw new Error("Failed to fetch Gamma events");
        const events = await gammaRes.json();

        let market: any = null;
        if (Array.isArray(events)) {
            for (const event of events) {
                if (!Array.isArray(event.markets)) continue;
                const found = event.markets.find((m: any) => m.conditionId === conditionId);
                if (found) { market = found; break; }
            }
        }

        if (!market) {
            console.log("[fetchMarketHistoryAction] No market found for conditionId.");
            return [];
        }

        const clobTokenIdsStr = market.clobTokenIds;
        if (!clobTokenIdsStr) return [];

        const clobTokenIds: string[] = JSON.parse(clobTokenIdsStr);
        const tokenId = clobTokenIds[0];
        if (!tokenId) return [];

        console.log(`[fetchMarketHistoryAction] Resolved token ID: ${tokenId}. Fetching CLOB history...`);

        const clobRes = await fetch(
            `https://clob.polymarket.com/prices-history?interval=1d&market=${tokenId}&fidelity=60`,
            { next: { revalidate: 60 } }
        );
        if (!clobRes.ok) throw new Error("Failed to fetch CLOB prices history");

        const data = await clobRes.json();
        if (!data || !data.history) return [];

        return data.history.map((point: { t: number; p: number }) => ({
            time: new Date(point.t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            price: Number((point.p * 100).toFixed(1)),
        }));
    } catch (error) {
        console.error("[fetchMarketHistoryAction] Failed:", error);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Pro Analytics: Order Book & Slippage
// ---------------------------------------------------------------------------
export async function fetchOrderBookAction(tokenId: string) {
    try {
        const res = await fetch(
            `https://clob.polymarket.com/book?token_id=${tokenId}`,
            { next: { revalidate: 30 } }
        );
        if (!res.ok) return null;
        const data = await res.json();

        const bids: { price: string; size: string }[] = data.bids || [];
        const asks: { price: string; size: string }[] = data.asks || [];

        if (bids.length === 0 || asks.length === 0) return null;

        const bestBid = parseFloat(bids[0].price);
        const bestAsk = parseFloat(asks[0].price);
        const mid = (bestBid + bestAsk) / 2;
        const spreadPct = mid > 0 ? ((bestAsk - bestBid) / mid) * 100 : 0;

        // Simulate a $1,000 market buy walking up the ask ladder
        let remaining = 1000; // USDC to spend
        let sharesAcquired = 0;
        const sortedAsks = [...asks].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        for (const level of sortedAsks) {
            const levelPrice = parseFloat(level.price);
            const levelShares = parseFloat(level.size);
            const levelCost = levelPrice * levelShares;
            if (remaining <= 0) break;
            if (levelCost <= remaining) {
                sharesAcquired += levelShares;
                remaining -= levelCost;
            } else {
                sharesAcquired += remaining / levelPrice;
                remaining = 0;
            }
        }
        const avgFillPrice = sharesAcquired > 0 ? (1000 - remaining) / sharesAcquired : bestAsk;
        const slippagePct = bestAsk > 0 ? Math.abs((avgFillPrice - bestAsk) / bestAsk) * 100 : 0;

        // Liquidity depth: total USDC within 5% of mid on both sides
        const range = mid * 0.05;
        const liquidityDepth =
            bids.filter(b => parseFloat(b.price) >= mid - range)
                .reduce((s, b) => s + parseFloat(b.price) * parseFloat(b.size), 0) +
            asks.filter(a => parseFloat(a.price) <= mid + range)
                .reduce((s, a) => s + parseFloat(a.price) * parseFloat(a.size), 0);

        return {
            bestBid: parseFloat(bestBid.toFixed(4)),
            bestAsk: parseFloat(bestAsk.toFixed(4)),
            spreadPct: parseFloat(spreadPct.toFixed(3)),
            slippagePct: parseFloat(slippagePct.toFixed(3)),
            liquidityDepth: parseFloat(liquidityDepth.toFixed(2)),
        };
    } catch (error) {
        console.error("[fetchOrderBookAction] Failed:", error);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Pro Analytics: Whale Trade Tracker
// ---------------------------------------------------------------------------
export async function fetchWhaleTradesAction(tokenId: string, threshold = 1000) {
    try {
        const res = await fetch(
            `https://clob.polymarket.com/trades?token_id=${tokenId}&limit=100`,
            { next: { revalidate: 30 } }
        );
        if (!res.ok) return { whaleTrades: [], totalWhaleVolume: 0 };
        const data = await res.json();
        const trades: any[] = Array.isArray(data) ? data : (data.data || []);

        const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
        const whaleTrades = trades
            .filter((t: any) => {
                const ts = t.match_time
                    ? new Date(t.match_time).getTime()
                    : (t.timestamp ? t.timestamp * 1000 : 0);
                const usdcValue = parseFloat(t.size || "0") * parseFloat(t.price || "0");
                return ts >= cutoff24h && usdcValue >= threshold;
            })
            .map((t: any) => {
                const ts = t.match_time
                    ? new Date(t.match_time).getTime()
                    : (t.timestamp ? t.timestamp * 1000 : 0);
                const usdcValue = parseFloat(t.size || "0") * parseFloat(t.price || "0");
                const minutesAgo = Math.round((Date.now() - ts) / 60000);
                const formattedTime = minutesAgo < 60
                    ? `${minutesAgo}m ago`
                    : minutesAgo < 1440
                        ? `${Math.round(minutesAgo / 60)}h ago`
                        : `${Math.round(minutesAgo / 1440)}d ago`;
                return {
                    side: t.side === "BUY" || t.taker_side === "buy" ? "BUY" : "SELL",
                    usdcValue: parseFloat(usdcValue.toFixed(2)),
                    timestamp: ts,
                    formattedTime,
                };
            })
            .sort((a: any, b: any) => b.timestamp - a.timestamp);

        const totalWhaleVolume = whaleTrades.reduce((s: number, t: any) => s + t.usdcValue, 0);
        return { whaleTrades, totalWhaleVolume: parseFloat(totalWhaleVolume.toFixed(2)) };
    } catch (error) {
        console.error("[fetchWhaleTradesAction] Failed:", error);
        return { whaleTrades: [], totalWhaleVolume: 0 };
    }
}

// ---------------------------------------------------------------------------
// Pro Analytics: BTC 24h Trend (CoinGecko)
// ---------------------------------------------------------------------------
export async function fetchBtcTrendAction() {
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
            { next: { revalidate: 300 } } // 5-minute cache
        );
        if (!res.ok) return null; // graceful fallback for 429 rate limit
        const data = await res.json();
        const btc = data?.bitcoin;
        if (!btc) return null;
        return {
            price: parseFloat(btc.usd.toFixed(0)),
            change24h: parseFloat((btc.usd_24h_change || 0).toFixed(2)),
        };
    } catch (error) {
        console.error("[fetchBtcTrendAction] Failed:", error);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Pro Analytics: Orchestrator (resolves tokenId + fetches order book & whale data)
// ---------------------------------------------------------------------------
export async function fetchExtendedMarketDataAction(conditionId: string) {
    try {
        // Resolve tokenId from conditionId (same pattern as price history)
        const gammaRes = await fetch(
            `https://gamma-api.polymarket.com/events?active=true&closed=false&archived=false&limit=200&order=volume24hr&dir=desc`,
            { next: { revalidate: 60 } }
        );
        if (!gammaRes.ok) return null;
        const events = await gammaRes.json();

        let tokenId: string | null = null;
        if (Array.isArray(events)) {
            for (const event of events) {
                if (!Array.isArray(event.markets)) continue;
                const found = event.markets.find((m: any) => m.conditionId === conditionId);
                if (found?.clobTokenIds) {
                    const ids: string[] = JSON.parse(found.clobTokenIds);
                    tokenId = ids[0] || null;
                    break;
                }
            }
        }

        if (!tokenId) return null;

        const [orderBook, whaleData] = await Promise.all([
            fetchOrderBookAction(tokenId),
            fetchWhaleTradesAction(tokenId),
        ]);

        return { orderBook, whaleData, tokenId };
    } catch (error) {
        console.error("[fetchExtendedMarketDataAction] Failed:", error);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Social Intelligence: Types
// ---------------------------------------------------------------------------
interface NewsArticle {
    title: string;
    description: string | null;
    publishedAt: string;
    source: string;
    url: string;
}

interface RedditPost {
    title: string;
    score: number;
    num_comments: number;
    subreddit: string;
    created_utc: number;
}

interface CoinGeckoGlobal {
    marketCapChange24h: number;
    sentimentUp: number;
    totalMarketCap: number;
}

export interface SocialContext {
    news: NewsArticle[];
    reddit: RedditPost[];
    coinGecko: CoinGeckoGlobal | null;
}

export interface SocialAnalysis {
    sentiment_score: number;        // -1.0 to 1.0
    velocity: "Low" | "Medium" | "High";
    primary_narrative: string;
    alpha_signal: "None" | "Low" | "High";
    reasoning: string;
    trend_points: { label: string; value: number }[]; // 7 entries, article volume per day
    news_count: number;
    reddit_count: number;
    top_reddit_posts: { title: string; score: number; subreddit: string }[];
}

// ---------------------------------------------------------------------------
// Social Intelligence: Data Ingestion
// ---------------------------------------------------------------------------
export async function fetchSocialContextAction(
    marketTitle: string,
    category: string
): Promise<SocialContext> {
    const keywords = encodeURIComponent(marketTitle.slice(0, 80));
    const newsApiKey = process.env.NEWS_API_KEY || "";
    const CRYPTO_CATS = new Set(["Crypto", "Business"]);

    const [newsResult, redditResult, cgResult] = await Promise.allSettled([
        // --- NewsAPI ---
        newsApiKey
            ? fetch(
                `https://newsapi.org/v2/everything?q=${keywords}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${newsApiKey}`,
                { cache: "no-store" }
            ).then(async (r) => {
                if (!r.ok) return [];
                const d = await r.json();
                return (d.articles || []).map((a: any) => ({
                    title: a.title || "",
                    description: a.description || null,
                    publishedAt: a.publishedAt || new Date().toISOString(),
                    source: a.source?.name || "Unknown",
                    url: a.url || "",
                })) as NewsArticle[];
            })
            : Promise.resolve([] as NewsArticle[]),

        // --- Reddit (no API key needed) ---
        fetch(
            `https://www.reddit.com/search.json?q=${keywords}&sort=new&limit=25&t=day`,
            {
                headers: { "User-Agent": "PolyLens/1.0" },
                cache: "no-store",
            }
        ).then(async (r) => {
            if (!r.ok) return [];
            const d = await r.json();
            return ((d.data?.children || []) as any[]).map((c) => ({
                title: c.data.title || "",
                score: c.data.score || 0,
                num_comments: c.data.num_comments || 0,
                subreddit: c.data.subreddit || "",
                created_utc: c.data.created_utc || 0,
            })) as RedditPost[];
        }).catch(() => [] as RedditPost[]),

        // --- CoinGecko Global (only for relevant categories) ---
        CRYPTO_CATS.has(category)
            ? fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" })
                .then(async (r) => {
                    if (!r.ok) return null;
                    const d = await r.json();
                    const data = d.data;
                    return {
                        marketCapChange24h: parseFloat((data?.market_cap_change_percentage_24h_usd || 0).toFixed(2)),
                        sentimentUp: parseFloat((data?.market_cap_percentage?.btc || 0).toFixed(1)),
                        totalMarketCap: parseFloat((data?.total_market_cap?.usd || 0).toFixed(0)),
                    } as CoinGeckoGlobal;
                }).catch(() => null)
            : Promise.resolve(null),
    ]);

    return {
        news: newsResult.status === "fulfilled" ? newsResult.value : [],
        reddit: redditResult.status === "fulfilled" ? redditResult.value : [],
        coinGecko: cgResult.status === "fulfilled" ? cgResult.value : null,
    };
}

// ---------------------------------------------------------------------------
// Social Intelligence: Gemini AI Analysis
// ---------------------------------------------------------------------------
export async function analyzeSocialIntelligenceAction(
    conditionId: string,
    marketTitle: string,
    probability: string,
    category: string
): Promise<SocialAnalysis | null> {
    try {
        const geminiKey = process.env.GEMINI_API_KEY || "";
        if (!geminiKey) return null;

        // 1. Fetch raw social context
        const ctx = await fetchSocialContextAction(marketTitle, category);

        // 2. Build trend_points from NewsAPI publishedAt distribution (last 7 days)
        const now = Date.now();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now - (6 - i) * 86_400_000);
            return {
                label: d.toLocaleDateString("en-US", { weekday: "short" }),
                date: d.toISOString().slice(0, 10),
                count: 0,
            };
        });
        for (const article of ctx.news) {
            const articleDate = article.publishedAt.slice(0, 10);
            const bucket = days.find((d) => d.date === articleDate);
            if (bucket) bucket.count++;
        }
        // Include Reddit posts published today/yesterday
        const todayStr = new Date(now).toISOString().slice(0, 10);
        const yesterdayStr = new Date(now - 86_400_000).toISOString().slice(0, 10);
        const recentReddit = ctx.reddit.filter((p) => {
            const d = new Date(p.created_utc * 1000).toISOString().slice(0, 10);
            return d === todayStr || d === yesterdayStr;
        });
        if (days[6]) days[6].count += recentReddit.length;
        if (days[5] && yesterdayStr !== todayStr)
            days[5].count += ctx.reddit.filter(
                (p) => new Date(p.created_utc * 1000).toISOString().slice(0, 10) === yesterdayStr
            ).length;

        const maxCount = Math.max(...days.map((d) => d.count), 1);
        const trend_points = days.map((d) => ({
            label: d.label,
            value: Math.round((d.count / maxCount) * 100),
        }));

        // 3. Format context block for Gemini
        const newsBlock = ctx.news.length > 0
            ? ctx.news.map((a, i) => `  ${i + 1}. [${a.source}] ${a.title}${a.description ? ` — ${a.description.slice(0, 100)}` : ""}`).join("\n")
            : "  No recent news articles found.";

        const redditBlock = ctx.reddit.length > 0
            ? ctx.reddit.slice(0, 10).map((p) => `  • r/${p.subreddit} | ↑${p.score} | "${p.title.slice(0, 100)}"`).join("\n")
            : "  No recent Reddit posts found.";

        const cgBlock = ctx.coinGecko
            ? `\nCoinGecko Global Market Data:\n  • Crypto Market Cap Change (24h): ${ctx.coinGecko.marketCapChange24h}%\n  • BTC Dominance: ${ctx.coinGecko.sentimentUp}%`
            : "";

        const contextBlock = `
MARKET: "${marketTitle}"
CURRENT PROBABILITY (Yes): ${probability}%
CATEGORY: ${category}

=== REAL-TIME NEWS (from NewsAPI) ===
${newsBlock}

=== REDDIT SOCIAL POSTS (r/all search, last 24h) ===
${redditBlock}
${cgBlock}
`;

        // 4. Call Gemini with the exact system prompt from requirements
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are the 'PolyLens Alpha Analyst,' a specialized AI trained in behavioral finance and prediction market discrepancies.

Your Goal: Analyze the provided social media data (news headlines and Reddit posts) to find 'Divergence' between public buzz and market probability.

Instructions:
- Sentiment Velocity: Calculate how fast the sentiment is shifting. Is it a slow burn or an aggressive narrative shift?
- Narrative Extraction: Identify the single most influential argument currently driving the social conversation.
- Alpha Signal Detection: Compare the 'Social Interest' with the 'Market Probability'.
  • If Buzz is surging but Probability is flat = Positive Alpha (Lag Detected).
  • If Buzz is dying but Probability is rising = Overextended (Potential Correction).

Tone: Be clinical, objective, and concise. Use trader terminology (Alpha, Liquidity, Sentiment, Divergence).
Do NOT use the word "Trade". Use "Analyze", "Positioning", or "Market Movement" instead.

Output Format (Strict JSON, no markdown, no extra text):
{
  "sentiment_score": <float -1.0 to 1.0>,
  "velocity": "<Low|Medium|High>",
  "primary_narrative": "<string, max 120 chars>",
  "alpha_signal": "<None|Low|High>",
  "reasoning": "<string, max 2 sentences>"
}`,
        } as any);

        const result = await model.generateContent(contextBlock);
        const rawText = result.response.text()
            .replace(/```json\n?|\n?```/g, "")
            .trim();

        let parsed: any;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            // Try to extract JSON from the response if there's surrounding text
            const match = rawText.match(/\{[\s\S]*\}/);
            if (!match) return null;
            parsed = JSON.parse(match[0]);
        }

        return {
            sentiment_score: Math.max(-1, Math.min(1, parseFloat(parsed.sentiment_score ?? 0))),
            velocity: parsed.velocity ?? "Low",
            primary_narrative: parsed.primary_narrative ?? "No narrative identified.",
            alpha_signal: parsed.alpha_signal ?? "None",
            reasoning: parsed.reasoning ?? "",
            trend_points,
            news_count: ctx.news.length,
            reddit_count: ctx.reddit.length,
            top_reddit_posts: ctx.reddit.slice(0, 5).map((p) => ({
                title: p.title.slice(0, 100),
                score: p.score,
                subreddit: p.subreddit,
            })),
        };
    } catch (error) {
        console.error("[analyzeSocialIntelligenceAction] Failed:", error);
        return null;
    }
}
