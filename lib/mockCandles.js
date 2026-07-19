/**
 * Static OHLC candles for the session-02 chart shell.
 * `time` is UTC seconds (lightweight-charts candlestick format).
 *
 * @typedef {{ time: number, open: number, high: number, low: number, close: number }} Candle
 */

const INTERVAL_SECONDS = 15 * 60;
const START_TIME = 1_704_067_200; // 2024-01-01T00:00:00Z

/** Rough walk so the static chart is not a flat line. */
const CLOSES = [
  42000, 42150, 41980, 42240, 42310, 42100, 42450, 42600, 42520, 42780,
  42900, 42840, 43050, 43200, 43120, 43380, 43500, 43420, 43650, 43800,
  43720, 43950, 44100, 44020, 44280, 44400, 44310, 44550, 44700, 44620,
  44880, 45000, 44920, 45150, 45300, 45210, 45480, 45600, 45520, 45750,
];

/**
 * @param {number[]} closes
 * @returns {Candle[]}
 */
function buildCandles(closes) {
  /** @type {Candle[]} */
  const candles = [];
  let prevClose = closes[0];

  for (let i = 0; i < closes.length; i += 1) {
    const open = prevClose;
    const close = closes[i];
    const drift = Math.abs(close - open);
    const wick = Math.max(40, drift * 0.35);
    const high = Math.max(open, close) + wick;
    const low = Math.min(open, close) - wick;

    candles.push({
      time: START_TIME + i * INTERVAL_SECONDS,
      open,
      high,
      low,
      close,
    });

    prevClose = close;
  }

  return candles;
}

/** @type {Candle[]} */
export const MOCK_CANDLES = buildCandles(CLOSES);
