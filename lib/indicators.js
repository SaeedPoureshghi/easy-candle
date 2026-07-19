/**
 * Indicator registry and overlay builders for Easy Candle v2.
 *
 * Candle shape: `{ time` (UTC seconds), `open`, `high`, `low`, `close`, optional `volume` }.
 * Indicator state lives in the Zustand store — not in `replayEngine.js`.
 *
 * @typedef {import('./candleUtils').Candle} Candle
 *
 * @typedef {Object} IndicatorDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} color
 * @property {number} period
 * @property {(candles: Candle[], params?: { period?: number }) => OverlayPoint[]} compute
 *
 * @typedef {Object} OverlayPoint
 * @property {number} time UTC seconds
 * @property {number} value
 *
 * @typedef {Object} ChartOverlay
 * @property {string} id
 * @property {'line'} type
 * @property {OverlayPoint[]} data
 * @property {string} [color]
 */

/**
 * Simple moving average of close prices.
 *
 * @param {Candle[]} candles
 * @param {{ period?: number }} [params]
 * @returns {OverlayPoint[]}
 */
export function computeSma(candles, params = {}) {
  const period = Math.max(1, Math.floor(Number(params.period) || 20));
  if (!Array.isArray(candles) || candles.length < period) return [];

  /** @type {OverlayPoint[]} */
  const out = [];
  let sum = 0;

  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      out.push({
        time: candles[i].time,
        value: sum / period,
      });
    }
  }

  return out;
}

/**
 * Exponential moving average of close prices.
 * Seeds with SMA of the first `period` closes, then applies EMA.
 *
 * @param {Candle[]} candles
 * @param {{ period?: number }} [params]
 * @returns {OverlayPoint[]}
 */
export function computeEma(candles, params = {}) {
  const period = Math.max(1, Math.floor(Number(params.period) || 20));
  if (!Array.isArray(candles) || candles.length < period) return [];

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    sum += candles[i].close;
  }

  let ema = sum / period;
  /** @type {OverlayPoint[]} */
  const out = [{ time: candles[period - 1].time, value: ema }];

  for (let i = period; i < candles.length; i += 1) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({ time: candles[i].time, value: ema });
  }

  return out;
}

/** @type {IndicatorDefinition[]} */
export const INDICATORS = [
  {
    id: "sma20",
    label: "SMA 20",
    color: "#38bdf8",
    period: 20,
    compute: (candles) => computeSma(candles, { period: 20 }),
  },
  {
    id: "ema20",
    label: "EMA 20",
    color: "#f472b6",
    period: 20,
    compute: (candles) => computeEma(candles, { period: 20 }),
  },
];

/**
 * @param {string} id
 * @returns {IndicatorDefinition | null}
 */
export function getIndicator(id) {
  return INDICATORS.find((entry) => entry.id === id) ?? null;
}

/**
 * Build chart overlays for the active indicator ids.
 *
 * @param {Candle[]} candles
 * @param {string[]} [activeIds]
 * @returns {ChartOverlay[]}
 */
export function buildOverlays(candles, activeIds = []) {
  if (!Array.isArray(candles) || !candles.length) return [];
  if (!Array.isArray(activeIds) || !activeIds.length) return [];

  /** @type {ChartOverlay[]} */
  const overlays = [];

  for (const id of activeIds) {
    const def = getIndicator(id);
    if (!def) continue;
    const data = def.compute(candles);
    if (!data.length) continue;
    overlays.push({
      id: def.id,
      type: "line",
      data,
      color: def.color,
    });
  }

  return overlays;
}
