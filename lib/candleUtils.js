/**
 * Candle helpers shared by the Binance proxy and later client code.
 *
 * Convention: chart candles use `time` in **UTC seconds**.
 * Binance open times arrive in milliseconds and are converted at the boundary.
 *
 * @typedef {{ time: number, open: number, high: number, low: number, close: number, volume?: number }} Candle
 */

/**
 * Binance kline row:
 * [ openTimeMs, open, high, low, close, volume, closeTime, ... ]
 *
 * @param {unknown[]} row
 * @returns {Candle | null}
 */
export function mapBinanceKline(row) {
  if (!Array.isArray(row) || row.length < 6) return null;

  const openTimeMs = Number(row[0]);
  const open = Number(row[1]);
  const high = Number(row[2]);
  const low = Number(row[3]);
  const close = Number(row[4]);
  const volume = Number(row[5]);

  if (
    !Number.isFinite(openTimeMs) ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close)
  ) {
    return null;
  }

  /** @type {Candle} */
  const candle = {
    time: Math.floor(openTimeMs / 1000),
    open,
    high,
    low,
    close,
  };

  if (Number.isFinite(volume)) {
    candle.volume = volume;
  }

  return candle;
}

/**
 * @param {unknown[]} rows
 * @returns {Candle[]}
 */
export function mapBinanceKlines(rows) {
  if (!Array.isArray(rows)) return [];

  /** @type {Candle[]} */
  const candles = [];
  for (const row of rows) {
    const candle = mapBinanceKline(/** @type {unknown[]} */ (row));
    if (candle) candles.push(candle);
  }
  return candles;
}

/**
 * Keep first occurrence per `time`, then sort ascending.
 *
 * @param {Candle[]} candles
 * @returns {Candle[]}
 */
export function dedupeCandlesByTime(candles) {
  const byTime = new Map();
  for (const candle of candles) {
    if (!byTime.has(candle.time)) {
      byTime.set(candle.time, candle);
    }
  }
  return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
}

/**
 * Clamp requested limit to Binance's allowed range.
 *
 * @param {unknown} value
 * @param {number} [fallback=500]
 * @returns {number}
 */
export function clampKlineLimit(value, fallback = 500) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1000, Math.max(1, Math.floor(n)));
}
