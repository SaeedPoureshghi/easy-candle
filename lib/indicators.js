/**
 * Indicator registry (stub for v1).
 *
 * Real indicators are out of scope for Easy Candle v1. Later sessions may
 * implement `compute(candles, params)` for each entry; until then this module
 * only documents the intended contract.
 *
 * Candle shape matches `lib/candleUtils` / chart series:
 * `{ time` (UTC seconds), `open`, `high`, `low`, `close`, optional `volume` }.
 *
 * Chart readiness: `CandleChart` accepts an optional `overlays` prop for future
 * line/area series. Do not put indicator state into `replayEngine.js`.
 *
 * @typedef {import('./candleUtils').Candle} Candle
 *
 * @typedef {Object} IndicatorDefinition
 * @property {string} id
 * @property {string} label
 * @property {(candles: Candle[], params?: Record<string, unknown>) => unknown} [compute]
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

/** @type {IndicatorDefinition[]} */
export const INDICATORS = [];

/**
 * Resolve an indicator by id. Always returns null in v1.
 *
 * @param {string} _id
 * @returns {IndicatorDefinition | null}
 */
export function getIndicator(_id) {
  return null;
}

/**
 * Placeholder for future overlay computation from registered indicators.
 * Returns an empty list in v1.
 *
 * @param {Candle[]} _candles
 * @returns {ChartOverlay[]}
 */
export function buildOverlays(_candles) {
  return [];
}
