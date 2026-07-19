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
