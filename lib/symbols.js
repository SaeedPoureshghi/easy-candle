/** @typedef {{ id: string, label: string, binanceSymbol: string }} SymbolConfig */

/** @type {SymbolConfig[]} */
export const SYMBOLS = [
  {
    id: "btcusdt",
    label: "BTC/USDT",
    binanceSymbol: "BTCUSDT",
  },
];

/** @type {SymbolConfig} */
export const DEFAULT_SYMBOL = SYMBOLS[0];

/** Allowlisted Binance symbols (uppercase). */
export const ALLOWED_SYMBOLS = new Set(
  SYMBOLS.map((symbol) => symbol.binanceSymbol.toUpperCase()),
);

/**
 * @param {string} symbol
 * @returns {boolean}
 */
export function isAllowedSymbol(symbol) {
  return ALLOWED_SYMBOLS.has(String(symbol || "").toUpperCase());
}
