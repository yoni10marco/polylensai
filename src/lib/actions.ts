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
            if (market.groupItemTitle) return market.groupItemTitle;
            if (market.category) return market.category;
            if (market.tags && market.tags.length > 0) return market.tags[0];
            return "General";
        };

        // Robust Mapping Logic
        const mappedData = data.map((market: any) => {
            // Find finding probability
            let probability: number | string = "N/A";
            if (market.outcomes && market.outcomePrices && market.outcomes.length > 0) {
                // Usually outcomePrices is an array matching outcomes ("Yes", "No")
                // Let's grab the price for the first outcome (e.g. "Yes") or index 0
                try {
                    const priceString = market.outcomePrices[0];
                    if (priceString) {
                        probability = Number((parseFloat(priceString) * 100).toFixed(1));
                    }
                } catch (e) {
                    console.log(`[fetchActiveMarketsAction] Error parsing probability for ${market.id}`, e);
                }
            }

            return {
                id: market.conditionId || market.id || market.slug,
                title: market.question || "Unknown Market",
                category: getCategory(market),
                probability: probability,
                volume: formatVolume(market.volume || market.volume24hr),
                image: market.image || "",
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
