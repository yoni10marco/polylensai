/**
 * Polymarket API Service Integration
 * Using Polymarket Gamma API for historical prices.
 */

// Polymarket CLOB Gamma API
const POLYMARKET_CLOB_URL = 'https://clob.polymarket.com';

// Condition IDs for tracking markets (e.g. US Election)
// For this MVP, we use the US Presidential Election Winner: Trump vs Biden/Harris etc.
// Replace with the active trending condition_id as needed.
const DEFAULT_MARKET_TOKEN_ID = '21742633143463906290569050155826241533067272736897614950488156847949938836455';

export async function fetchMarketPriceHistory(tokenId: string = DEFAULT_MARKET_TOKEN_ID) {
    try {
        // Fetch real-time price history from Polymarket CLOB API
        // Using fid=60 corresponds to 1-hour resolution typically, or 1D.
        const response = await fetch(`${POLYMARKET_CLOB_URL}/prices-history?interval=1d&market=${tokenId}`);

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
