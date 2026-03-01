"use server";

const VALID_CATEGORIES = ['Politics', 'Crypto', 'Sports', 'Pop Culture'] as const;

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

function getCategory(tags: Array<{ label?: string; slug?: string }> | undefined): string {
    if (!tags || !Array.isArray(tags)) return "Other";
    for (const tag of tags) {
        const label = tag.label || "";
        const matched = VALID_CATEGORIES.find(c =>
            label.toLowerCase().includes(c.toLowerCase())
        );
        if (matched) return matched;
    }
    return "Other";
}

export async function fetchActiveMarketsAction(limit = 50) {
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
        if (events[0]) {
            console.log("FIRST_EVENT_DEBUG:", JSON.stringify({
                id: events[0].id,
                title: events[0].title,
                volume24hr: events[0].volume24hr,
                tags: events[0].tags,
                marketsCount: events[0].markets?.length,
                firstMarket: events[0].markets?.[0] ? {
                    conditionId: events[0].markets[0].conditionId,
                    outcomePrices: events[0].markets[0].outcomePrices,
                    volume: events[0].markets[0].volume,
                } : null
            }, null, 2));
        }

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
                category: getCategory(event.tags),
                probability: getProbability(market.outcomePrices),
                volume: formatVolume(market.volume || event.volume),
                volume24hr: formatVolume(event.volume24hr),
                image: event.image || market.image || "",
                sentiment: Math.random() > 0.5 ? "Positive" : "Negative",
                slug: market.slug || event.slug,
                endDate: market.endDateIso || event.endDate,
            }));
        });

        console.log(`[fetchActiveMarketsAction] Mapped ${mappedMarkets.length} markets.`);
        return mappedMarkets;
    } catch (error) {
        console.error("[fetchActiveMarketsAction] Failed:", error);
        return [];
    }
}

export async function fetchMarketByConditionId(conditionId: string) {
    try {
        const res = await fetch(
            `https://gamma-api.polymarket.com/markets?condition_id=${conditionId}`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;

        const market = data[0];
        console.log(`[fetchMarketByConditionId] Found market: ${market.question}`);
        return {
            id: market.conditionId,
            conditionId: market.conditionId,
            title: market.question || "Unknown Market",
            probability: getProbability(market.outcomePrices),
            volume: formatVolume(market.volume),
            volume24hr: formatVolume(market.volume24hr),
            image: market.image || "",
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
            endDate: market.endDateIso,
            slug: market.slug,
        };
    } catch (error) {
        console.error("[fetchMarketByConditionId] Failed:", error);
        return null;
    }
}

export async function fetchMarketPriceHistoryAction(conditionId: string) {
    try {
        console.log(`[fetchMarketHistoryAction] Resolving token ID for condition: ${conditionId}`);

        const gammaRes = await fetch(
            `https://gamma-api.polymarket.com/markets?condition_id=${conditionId}`,
            { next: { revalidate: 60 } }
        );
        if (!gammaRes.ok) throw new Error("Failed to fetch Gamma market details");
        const gammaData = await gammaRes.json();

        if (!Array.isArray(gammaData) || gammaData.length === 0) {
            console.log("[fetchMarketHistoryAction] No market found for conditionId.");
            return [];
        }

        const market = gammaData[0];
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
