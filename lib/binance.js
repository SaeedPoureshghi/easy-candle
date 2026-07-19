import { dedupeCandlesByTime, mapBinanceKlines } from "@/lib/candleUtils";

export const BINANCE_API_BASE = "https://api.binance.com";
export const BINANCE_KLINES_PATH = "/api/v3/klines";

/**
 * @typedef {{
 *   symbol: string,
 *   interval: string,
 *   startTime?: number,
 *   endTime?: number,
 *   limit?: number,
 * }} BinanceKlinesParams
 */

/**
 * Build a Binance klines URL from allowlisted params.
 *
 * @param {BinanceKlinesParams} params
 * @returns {string}
 */
export function buildKlinesUrl(params) {
  const url = new URL(BINANCE_KLINES_PATH, BINANCE_API_BASE);
  url.searchParams.set("symbol", params.symbol.toUpperCase());
  url.searchParams.set("interval", params.interval);

  if (params.limit != null) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params.startTime != null) {
    url.searchParams.set("startTime", String(params.startTime));
  }
  if (params.endTime != null) {
    url.searchParams.set("endTime", String(params.endTime));
  }

  return url.toString();
}

/**
 * True when the requested range is entirely in the past (safe to cache hard).
 *
 * @param {number | undefined} endTimeMs
 * @returns {boolean}
 */
export function isHistoricalRange(endTimeMs) {
  if (endTimeMs == null || !Number.isFinite(endTimeMs)) return false;
  return endTimeMs < Date.now() - 60_000;
}

/**
 * Fetch Binance klines and normalize to chart candles (`time` in seconds).
 *
 * @param {BinanceKlinesParams} params
 * @param {{ revalidate?: number | false }} [cache]
 * @returns {Promise<{ candles: import("@/lib/candleUtils").Candle[], upstreamStatus: number }>}
 */
export async function fetchBinanceKlines(params, cache = {}) {
  const url = buildKlinesUrl(params);
  const revalidate = cache.revalidate ?? 60;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(
      detail
        ? `Binance klines failed (${response.status}): ${detail.slice(0, 200)}`
        : `Binance klines failed (${response.status})`,
    );
    error.name = "BinanceUpstreamError";
    error.status = response.status;
    throw error;
  }

  const rows = await response.json();
  const candles = dedupeCandlesByTime(mapBinanceKlines(rows));

  return {
    candles,
    upstreamStatus: response.status,
  };
}
