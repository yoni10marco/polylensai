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
