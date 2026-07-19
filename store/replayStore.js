"use client";

import { create } from "zustand";
import { fetchCandles } from "@/lib/binance";
import { DEFAULT_SYMBOL } from "@/lib/symbols";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframes";

/**
 * Early chart store. Replay fields land in later sessions; name kept for continuity.
 *
 * @typedef {'idle' | 'loading' | 'ready' | 'error'} ChartStatus
 */

let loadGeneration = 0;

export const useReplayStore = create((set, get) => ({
  symbol: DEFAULT_SYMBOL.binanceSymbol,
  timeframe: DEFAULT_TIMEFRAME,
  /** @type {import("@/lib/candleUtils").Candle[]} */
  candles: [],
  /** @type {ChartStatus} */
  status: "idle",
  /** @type {string | null} */
  error: null,

  /**
   * @param {string} symbol Binance symbol, e.g. BTCUSDT
   */
  setSymbol(symbol) {
    if (symbol === get().symbol) return;
    set({ symbol });
    get().loadCandles();
  },

  /**
   * @param {string} timeframe Interval id, e.g. 15m
   */
  setTimeframe(timeframe) {
    if (timeframe === get().timeframe) return;
    set({ timeframe, candles: [] });
    get().loadCandles();
  },

  async loadCandles() {
    const generation = (loadGeneration += 1);
    const { symbol, timeframe } = get();

    set({ status: "loading", error: null });

    try {
      const candles = await fetchCandles({
        symbol,
        interval: timeframe,
      });

      if (generation !== loadGeneration) return;

      set({
        candles,
        status: "ready",
        error: null,
      });
    } catch (err) {
      if (generation !== loadGeneration) return;

      const message =
        err instanceof Error ? err.message : "Failed to load candles";

      set({
        candles: [],
        status: "error",
        error: message,
      });
    }
  },
}));
