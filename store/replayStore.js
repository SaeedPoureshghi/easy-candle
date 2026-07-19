"use client";

import { create } from "zustand";
import { fetchCandles } from "@/lib/binance";
import { createReplayEngine } from "@/lib/replayEngine";
import { DEFAULT_SYMBOL } from "@/lib/symbols";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframes";

/**
 * @typedef {'idle' | 'loading' | 'ready' | 'error'} ChartStatus
 * @typedef {'live' | 'replay'} ViewMode
 * @typedef {'replace' | 'append'} ChartSyncKind
 * @typedef {'idle' | 'ready' | 'playing' | 'paused' | 'ended'} ReplayStatus
 * @typedef {import("@/lib/candleUtils").Candle} Candle
 * @typedef {{ kind: ChartSyncKind, fitContent: boolean, revision: number }} ChartSync
 */

const engine = createReplayEngine();

/** Base interval for 1x playback (ms per candle). */
const BASE_TICK_MS = 500;

/** @type {ReturnType<typeof setInterval> | null} */
let clockTimer = null;
let loadGeneration = 0;

function clearClock() {
  if (clockTimer != null) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

function tickMs() {
  const speed = engine.getState().speed || 1;
  return Math.max(50, BASE_TICK_MS / speed);
}

/**
 * @returns {{
 *   replayStatus: ReplayStatus,
 *   isPlaying: boolean,
 *   speed: number,
 *   replayIndex: number,
 *   visibleCandles: Candle[],
 *   currentCandle: Candle | null,
 * }}
 */
function engineSnapshot() {
  const state = engine.getState();
  return {
    replayStatus: state.status,
    isPlaying: state.isPlaying,
    speed: state.speed,
    replayIndex: state.index,
    visibleCandles: engine.getVisibleCandles(),
    currentCandle: engine.getCurrentCandle(),
  };
}

export const useReplayStore = create((set, get) => {
  /**
   * @param {ChartSyncKind} kind
   * @param {{ fitContent?: boolean }} [opts]
   */
  function publishReplay(kind, opts = {}) {
    const snap = engineSnapshot();
    const fitContent = opts.fitContent ?? kind === "replace";
    set((s) => ({
      mode: "replay",
      ...snap,
      chartSync: {
        kind,
        fitContent: kind === "append" ? false : fitContent,
        revision: s.chartSync.revision + 1,
      },
    }));
  }

  function publishStatus() {
    set({
      mode: "replay",
      ...engineSnapshot(),
    });
  }

  function stopClock() {
    clearClock();
  }

  function startClock() {
    stopClock();

    clockTimer = setInterval(() => {
      const { mode, isPlaying } = get();
      if (mode !== "replay" || !isPlaying) {
        stopClock();
        return;
      }

      const before = engine.getState().index;
      engine.stepForward();
      const after = engine.getState().index;

      if (after > before) {
        publishReplay("append");
      } else {
        publishReplay("replace", { fitContent: false });
        stopClock();
      }

      if (engine.getState().status === "ended") {
        stopClock();
      }
    }, tickMs());
  }

  function resetReplayState() {
    stopClock();
    engine.load([]);
    set((s) => ({
      mode: "live",
      replayStatus: "idle",
      isPlaying: false,
      speed: 1,
      replayIndex: 0,
      visibleCandles: [],
      currentCandle: null,
      chartSync: {
        kind: "replace",
        fitContent: true,
        revision: s.chartSync.revision + 1,
      },
    }));
  }

  return {
    symbol: DEFAULT_SYMBOL.binanceSymbol,
    timeframe: DEFAULT_TIMEFRAME,
    /** @type {Candle[]} */
    candles: [],
    /** @type {ChartStatus} */
    status: "idle",
    /** @type {string | null} */
    error: null,

    /** @type {ViewMode} */
    mode: "live",
    /** @type {ReplayStatus} */
    replayStatus: "idle",
    isPlaying: false,
    speed: 1,
    replayIndex: 0,
    /** @type {Candle[]} */
    visibleCandles: [],
    /** @type {Candle | null} */
    currentCandle: null,
    /** @type {ChartSync} */
    chartSync: { kind: "replace", fitContent: true, revision: 0 },

    /**
     * @param {string} symbol Binance symbol, e.g. BTCUSDT
     */
    setSymbol(symbol) {
      if (symbol === get().symbol) return;
      resetReplayState();
      set({ symbol });
      get().loadCandles();
    },

    /**
     * @param {string} timeframe Interval id, e.g. 15m
     */
    setTimeframe(timeframe) {
      if (timeframe === get().timeframe) return;
      resetReplayState();
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

    /**
     * Enter replay from already-loaded candles.
     *
     * @param {{ startIndex?: number, startTime?: number }} [opts]
     */
    enterReplay(opts = {}) {
      const { candles } = get();
      if (!candles.length) return;

      stopClock();
      engine.load(candles);

      if (Number.isFinite(opts.startTime)) {
        engine.seekToTime(/** @type {number} */ (opts.startTime));
      } else if (Number.isFinite(opts.startIndex)) {
        engine.seekToIndex(/** @type {number} */ (opts.startIndex));
      } else {
        // Manual-test default: start a bit before the latest candles.
        engine.seekToIndex(Math.max(0, candles.length - 80));
      }

      publishReplay("replace", { fitContent: true });
    },

    exitReplay() {
      resetReplayState();
    },

    play() {
      if (get().mode !== "replay") return;
      if (engine.getState().status === "ended") return;

      engine.play();
      publishStatus();
      startClock();
    },

    pause() {
      if (get().mode !== "replay") return;

      engine.pause();
      stopClock();
      publishStatus();
    },

    stepForward() {
      if (get().mode !== "replay") return;

      stopClock();
      engine.pause();

      const before = engine.getState().index;
      engine.stepForward();
      const after = engine.getState().index;

      publishReplay(after > before ? "append" : "replace", {
        fitContent: false,
      });
    },

    stepBackward() {
      if (get().mode !== "replay") return;

      stopClock();
      engine.stepBackward();
      publishReplay("replace", { fitContent: false });
    },

    /**
     * @param {number} speed
     */
    setSpeed(speed) {
      engine.setSpeed(speed);
      const next = engine.getState().speed;
      const { mode, isPlaying } = get();
      set({ speed: next });

      if (mode === "replay" && isPlaying) {
        engine.play();
        startClock();
      }
    },

    /**
     * @param {number} index
     */
    seekToIndex(index) {
      if (get().mode !== "replay") return;
      stopClock();
      engine.seekToIndex(index);
      publishReplay("replace", { fitContent: false });
    },

    /**
     * @param {number} timeSeconds
     */
    seekToTime(timeSeconds) {
      if (get().mode !== "replay") return;
      stopClock();
      engine.seekToTime(timeSeconds);
      publishReplay("replace", { fitContent: false });
    },
  };
});
