"use server";

export async function fetchActiveMarketsAction(limit = 50) {
    try {
        console.log(`[fetchActiveMarketsAction] Fetching markets from Gamma API... limit=${limit}`);
        const res = await fetch(`https://gamma-api.polymarket.com/markets?active=true&limit=${limit}&order=volume&dir=desc`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!res.ok) {
            console.error(`[fetchActiveMarketsAction] API Error: ${res.status} ${res.statusText}`);
            throw new Error(`Gamma API responded with status: ${res.status}`);
        }

        const data = await res.json();
        console.log(`[fetchActiveMarketsAction] Successfully fetched ${data.length || 0} markets.`);

        const formatVolume = (vol: any) => {
            if (!vol || isNaN(Number(vol)) || Number(vol) === 0) return "$0";
            return new Intl.NumberFormat('en-US', {
                notation: "compact",
                compactDisplay: "short",
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 1
            }).format(Number(vol));
        };

        const getCategory = (market: any) => {
            const VALID_CATEGORIES = ['Politics', 'Crypto', 'Sports', 'Pop Culture'];
            return VALID_CATEGORIES.find(c =>
                market.groupItemTitle?.includes(c) ||
                market.category?.includes(c) ||
                market.tags?.some((t: string) => t.includes(c))
            ) || 'Other';
        };

        if (!Array.isArray(data)) return [];
        console.log("FIRST_MARKET_DEBUG:", data[0]);

        // Robust Mapping Logic
        const mappedData = data.map((market: any) => {
            // Find finding probability
            let probability: number | string = "N/A";
            try {
                const prices = JSON.parse(market.outcomePrices || "[]");
                probability = prices[0] ? (parseFloat(prices[0]) * 100).toFixed(1) : "N/A";
            } catch (e) {
                console.log(`[fetchActiveMarketsAction] Error parsing probability for ${market.conditionId}`, e);
            }

            const volumePrice = market.volume ? parseFloat(market.volume) : 0;

            return {
                id: market.conditionId, // Use conditionId as id for routing
                title: market.question || "Unknown Market",
                category: getCategory(market),
                probability: probability,
                volume: formatVolume(volumePrice),
                image: market.image || market.icon || "",
                sentiment: Math.random() > 0.5 ? "Positive" : "Negative", // Mock sentiment
                conditionId: market.conditionId,
                slug: market.slug,
            };
        });

        return mappedData;
    } catch (error) {
        console.error("[fetchActiveMarketsAction] Failed to fetch or map markets:", error);
        return [];
    }
}

export async function fetchMarketPriceHistoryAction(conditionId: string) {
    try {
        console.log(`[fetchMarketHistoryAction] Resolving token ID for condition: ${conditionId}`);
        // 1. Fetch from Gamma API to get clobTokenIds corresponding to the conditionId
        const gammaRes = await fetch(`https://gamma-api.polymarket.com/markets?condition_id=${conditionId}`, { next: { revalidate: 60 } });
        if (!gammaRes.ok) throw new Error("Failed to fetch Gamma market details");
        const gammaData = await gammaRes.json();

        if (!gammaData || gammaData.length === 0) {
            console.log("[fetchMarketHistoryAction] No market found for conditionId.");
            return [];
        }

        console.log(`[fetchMarketHistoryAction] Full Market Object Schema for debugging:`, JSON.stringify(gammaData[0], null, 2));

        const clobTokenIdsStr = gammaData[0].clobTokenIds;
        if (!clobTokenIdsStr) return [];

        const clobTokenIds = JSON.parse(clobTokenIdsStr);
        const resolvedTokenId = clobTokenIds[0] || clobTokenIds[1]; // Typically index 0 is Yes or primary outcome

        if (!resolvedTokenId) return [];

        console.log(`[fetchMarketHistoryAction] Resolved token ID: ${resolvedTokenId}. Fetching CLOB history...`);
        // 2. Fetch history from CLOB API
        const clobRes = await fetch(`https://clob.polymarket.com/prices-history?interval=1d&market=${resolvedTokenId}&fidelity=60`, { next: { revalidate: 60 } });
        if (!clobRes.ok) throw new Error("Failed to fetch CLOB prices history");

        const data = await clobRes.json();

        if (!data || !data.history) return [];

        // 3. Map to Recharts format { time, price }
        return data.history.map((point: { t: number, p: number }) => {
            const date = new Date(point.t * 1000);
            return {
                time: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                price: Number((point.p * 100).toFixed(1))
            };
        });

    } catch (error) {
        console.error("[fetchMarketHistoryAction] Failed to fetch history:", error);
        return null;
    }
}
