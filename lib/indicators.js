/**
 * Indicator registry (stub for v1).
 *
 * Real indicators are out of scope for Easy Candle v1. Later sessions may
 * implement `compute(candles, params)` for each entry; until then this module
 * only documents the intended contract.
 *
 * @typedef {{ time: number, open: number, high: number, low: number, close: number }} Candle
 *
 * @typedef {Object} IndicatorDefinition
 * @property {string} id
 * @property {string} label
 * @property {(candles: Candle[], params?: Record<string, unknown>) => unknown} [compute]
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
