// Generous headroom above any real vehicle price, but small enough to catch
// fat-finger/unit errors (e.g. a unit price entered as 1,111,111,111,111,112
// instead of 1,111,112) before they propagate into a SalesOrder total.
export const MAX_REASONABLE_PRICE_ETB = 10000000_000_000;
