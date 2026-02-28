/**
 * Polymarket API Service Integration
 * Using Polymarket Gamma API for historical prices.
 */

// Polymarket CLOB Gamma API
const POLYMARKET_CLOB_URL = 'https://clob.polymarket.com';

// Using an active market for MicroStrategy selling Bitcoin in 2026.
const DEFAULT_MARKET_TOKEN_ID = '111128191581505463501777127559667396812474366956707382672202929745167742497287';

export async function fetchMarketPriceHistory(tokenId: string = DEFAULT_MARKET_TOKEN_ID) {
    try {
        // Fetch real-time price history from Polymarket CLOB API
        // Using fidelity=60 corresponds to 1-hour resolution typically, or 1D.
        const response = await fetch(`${POLYMARKET_CLOB_URL}/prices-history?interval=1d&market=${tokenId}&fidelity=60`);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();

        // The history endpoint typically returns { history: [{ t: timestamp, p: price }] }
        if (!data || !data.history) {
            return [];
        }

        // Map to required Recharts format matching `{ time: string, price: number }`
        return data.history.map((point: { t: number, p: number }) => {
            const date = new Date(point.t * 1000); // Unix timestamp is in seconds

            return {
                // Format to HH:MM or MM/DD depending on scope. Sticking to HH:MM for intraday/short views or Date string.
                time: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                price: Number((point.p * 100).toFixed(1)) // Convert 0.55 probability to 55.0 cents
            };
        });

    } catch (error) {
        console.error("Failed to fetch Polymarket price history", error);
        return null; // Return null so the UI can handle the error state gracefully
    }
}

// Fetch active markets for the Global Markets grid
export async function fetchActiveMarkets(category?: string) {
    try {
        // Querying the Gamma API for trending events
        const url = new URL('https://gamma-api.polymarket.com/events');
        url.searchParams.append('active', 'true');
        url.searchParams.append('closed', 'false');
        url.searchParams.append('limit', '20');

        // Note: The Gamma API groups markets under events. 
        // For simplicity in this demo, we'll extract the first market of each event.
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("Failed to fetch markets");

        const events = await response.json();

        return events.map((event: any) => {
            const primaryMarket = event.markets && event.markets.length > 0 ? event.markets[0] : null;
            // Provide a mock sentiment based on pure random selection to demonstrate the UI
            const mockSentiment = Math.random() > 0.6 ? 'Positive' : Math.random() > 0.3 ? 'Neutral' : 'Negative';

            return {
                id: primaryMarket ? primaryMarket.id : event.id,
                title: event.title,
                category: event.tags ? event.tags[0] : 'General',
                probability: primaryMarket ? Math.round(primaryMarket.outcomePrices[0] * 100) : 0,
                volume: event.volume ? Number(event.volume).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
                sentiment: mockSentiment,
                image: event.image || null,
            };
        }).filter((m: any) => m.id && m.probability > 0);

    } catch (error) {
        console.error("Failed to fetch active markets", error);
        return [];
    }
}

// Simulated real-time news stream for the Dashboard NewsFeed
export async function fetchRealtimeNews() {
    // In a real production app, this would connect to NewsAPI, a WebSocket, or Twitter firehose
    // We return a mock list simulating fresh ingestion
    return [
        {
            id: 1,
            time: "2 mins ago",
            title: "Federal Reserve signals potential rate cut in September following inflation data",
            category: "Macro",
            impact: "High",
            impactScore: 9,
            trend: "up"
        },
        {
            id: 2,
            time: "15 mins ago",
            title: "MicroStrategy acquires additional 12,000 BTC for $821.7M",
            category: "Crypto",
            impact: "High",
            impactScore: 8,
            trend: "up"
        },
        {
            id: 3,
            time: "1 hour ago",
            title: "New swing state polling shows tied race in Pennsylvania",
            category: "Politics",
            impact: "High",
            impactScore: 8,
            trend: "down"
        },
        {
            id: 4,
            time: "3 hours ago",
            title: "OpenAI announces GPT-5 release window delayed to late 2025",
            category: "Tech",
            impact: "Medium",
            impactScore: 6,
            trend: "down"
        }
    ];
}
