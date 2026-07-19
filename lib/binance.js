import {
  clampKlineLimit,
  dedupeCandlesByTime,
  mapBinanceKlines,
} from "@/lib/candleUtils";

export const BINANCE_API_BASE = "https://api.binance.com";
export const BINANCE_KLINES_PATH = "/api/v3/klines";

/** Default pages (×1000) for the live chart history window. */
export const DEFAULT_HISTORY_PAGES = 2;

/** Candles before the replay start (context left of the playhead). */
export const REPLAY_LOOKBACK_BARS = 200;

/** Candles after the replay start loaded up front. */
export const REPLAY_FORWARD_BARS = 500;

/** Batch size when extending the buffer during play. */
export const PREFETCH_BATCH_SIZE = 500;

/** Max forward pages when filling a replay/jump window. */
const MAX_RANGE_PAGES = 8;

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

/**
 * Client-side: fetch one page from our `/api/klines` proxy.
 *
 * @param {{
 *   symbol: string,
 *   interval: string,
 *   startTime?: number,
 *   endTime?: number,
 *   limit?: number,
 * }} params
 * @returns {Promise<import("@/lib/candleUtils").Candle[]>}
 */
export async function fetchCandlesPage(params) {
  const limit = clampKlineLimit(params.limit, 1000);
  const search = new URLSearchParams({
    symbol: params.symbol.toUpperCase(),
    interval: params.interval,
    limit: String(limit),
  });

  if (params.startTime != null) {
    search.set("startTime", String(params.startTime));
  }
  if (params.endTime != null) {
    search.set("endTime", String(params.endTime));
  }

  const response = await fetch(`/api/klines?${search.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 429) {
    throw new Error("Rate limited by Binance (429). Try again shortly.");
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = body.detail ? ` — ${body.detail}` : "";
    throw new Error(
      (body.error || `Failed to load candles (${response.status})`) + detail,
    );
  }

  return Array.isArray(body.candles) ? body.candles : [];
}

/**
 * Client-side: paginate backwards from `endTime` (default: now) for a history window.
 * Requests are serialized; each page is at most 1000 candles.
 *
 * @param {{
 *   symbol: string,
 *   interval: string,
 *   pages?: number,
 *   limit?: number,
 *   endTime?: number,
 * }} params
 * @returns {Promise<import("@/lib/candleUtils").Candle[]>}
 */
export async function fetchCandles(params) {
  const pages = Math.max(1, Math.min(5, params.pages ?? DEFAULT_HISTORY_PAGES));
  const limit = clampKlineLimit(params.limit, 1000);
  let endTime = params.endTime ?? Date.now();

  /** @type {import("@/lib/candleUtils").Candle[]} */
  const batches = [];

  for (let page = 0; page < pages; page += 1) {
    const batch = await fetchCandlesPage({
      symbol: params.symbol,
      interval: params.interval,
      endTime,
      limit,
    });

    if (batch.length === 0) break;

    batches.push(batch);

    const earliestMs = batch[0].time * 1000;
    endTime = earliestMs - 1;

    if (batch.length < limit) break;
  }

  // Pages were fetched newest→oldest; reverse so oldest comes first.
  batches.reverse();
  return dedupeCandlesByTime(batches.flat());
}

/**
 * Client-side: fetch candles covering `[startTime, endTime]` (Unix ms), paging forward.
 *
 * @param {{
 *   symbol: string,
 *   interval: string,
 *   startTime: number,
 *   endTime: number,
 *   limit?: number,
 * }} params
 * @returns {Promise<import("@/lib/candleUtils").Candle[]>}
 */
export async function fetchCandlesRange(params) {
  const limit = clampKlineLimit(params.limit, 1000);
  const endTime = Math.floor(params.endTime);
  let cursor = Math.floor(params.startTime);

  if (!Number.isFinite(cursor) || !Number.isFinite(endTime) || cursor >= endTime) {
    return [];
  }

  /** @type {import("@/lib/candleUtils").Candle[]} */
  const batches = [];

  for (let page = 0; page < MAX_RANGE_PAGES; page += 1) {
    const batch = await fetchCandlesPage({
      symbol: params.symbol,
      interval: params.interval,
      startTime: cursor,
      endTime,
      limit,
    });

    if (batch.length === 0) break;

    batches.push(batch);

    const last = batch[batch.length - 1];
    const lastOpenMs = last.time * 1000;

    if (lastOpenMs >= endTime - 1 || batch.length < limit) break;

    cursor = lastOpenMs + 1;
    if (cursor >= endTime) break;
  }

  return dedupeCandlesByTime(batches.flat());
}

/**
 * Client-side: fetch the next batch of candles after `afterTimeSeconds` (candle open, UTC seconds).
 *
 * @param {{
 *   symbol: string,
 *   interval: string,
 *   afterTimeSeconds: number,
 *   limit?: number,
 * }} params
 * @returns {Promise<import("@/lib/candleUtils").Candle[]>}
 */
export async function prefetchForward(params) {
  const after = Number(params.afterTimeSeconds);
  if (!Number.isFinite(after)) return [];

  const limit = clampKlineLimit(params.limit, PREFETCH_BATCH_SIZE);

  return fetchCandlesPage({
    symbol: params.symbol,
    interval: params.interval,
    startTime: Math.floor(after * 1000) + 1,
    limit,
  });
}

/**
 * Build a lookback + forward window (ms) around a UTC start time in seconds.
 *
 * @param {{
 *   startTimeSeconds: number,
 *   intervalSeconds: number,
 *   lookbackBars?: number,
 *   forwardBars?: number,
 * }} opts
 * @returns {{ startTimeMs: number, endTimeMs: number }}
 */
export function buildReplayWindowMs(opts) {
  const intervalSeconds = Math.max(1, opts.intervalSeconds);
  const lookback = opts.lookbackBars ?? REPLAY_LOOKBACK_BARS;
  const forward = opts.forwardBars ?? REPLAY_FORWARD_BARS;
  const startSec = Math.floor(opts.startTimeSeconds);

  const startTimeMs = Math.max(0, (startSec - lookback * intervalSeconds) * 1000);
  const endTimeMs = Math.min(
    Date.now(),
    (startSec + forward * intervalSeconds) * 1000,
  );

  return { startTimeMs, endTimeMs };
}
