/** @typedef {{ id: string, label: string, binanceInterval: string, seconds: number }} TimeframeConfig */

/** @type {Record<string, TimeframeConfig>} */
export const TIMEFRAMES = {
  "1m": { id: "1m", label: "1m", binanceInterval: "1m", seconds: 60 },
  "5m": { id: "5m", label: "5m", binanceInterval: "5m", seconds: 300 },
  "15m": { id: "15m", label: "15m", binanceInterval: "15m", seconds: 900 },
  "1h": { id: "1h", label: "1h", binanceInterval: "1h", seconds: 3600 },
  "4h": { id: "4h", label: "4h", binanceInterval: "4h", seconds: 14400 },
  "1d": { id: "1d", label: "1d", binanceInterval: "1d", seconds: 86400 },
};

/** @type {string[]} */
export const TIMEFRAME_IDS = Object.keys(TIMEFRAMES);

/** @type {string} */
export const DEFAULT_TIMEFRAME = "15m";
