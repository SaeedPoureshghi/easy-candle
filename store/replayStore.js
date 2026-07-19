"use client";

import { create } from "zustand";
import {
  buildReplayWindowMs,
  fetchCandles,
  fetchCandlesRange,
  prefetchForward,
  PREFETCH_BATCH_SIZE,
} from "@/lib/binance";
import { findIndexAtOrBefore } from "@/lib/candleUtils";
import { createReplayEngine } from "@/lib/replayEngine";
import { DEFAULT_SYMBOL } from "@/lib/symbols";
import { DEFAULT_TIMEFRAME, TIMEFRAMES } from "@/lib/timeframes";

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
let replayRequestId = 0;
let prefetchInFlight = false;

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

function intervalSecondsFor(timeframe) {
  return TIMEFRAMES[timeframe]?.seconds ?? TIMEFRAMES[DEFAULT_TIMEFRAME].seconds;
}

/**
 * @returns {{
 *   replayStatus: ReplayStatus,
 *   isPlaying: boolean,
 *   speed: number,
 *   replayIndex: number,
 *   visibleCandles: Candle[],
 *   currentCandle: Candle | null,
 *   bufferLength: number,
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
    bufferLength: state.candles.length,
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
      candles: engine.getState().candles,
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
      candles: engine.getState().candles,
      ...engineSnapshot(),
    });
  }

  function stopClock() {
    clearClock();
  }

  async function maybePrefetch() {
    if (prefetchInFlight) return;
    if (get().mode !== "replay") return;
    if (!engine.needsPrefetch()) return;

    const buffer = engine.getState().candles;
    if (!buffer.length) return;

    const last = buffer[buffer.length - 1];
    const { symbol, timeframe } = get();
    const intervalSec = intervalSecondsFor(timeframe);
    const nowSec = Math.floor(Date.now() / 1000);

    // Near the live edge — nothing useful to prefetch.
    if (last.time + intervalSec >= nowSec) return;

    prefetchInFlight = true;
    set({ isPrefetching: true });

    try {
      const more = await prefetchForward({
        symbol,
        interval: timeframe,
        afterTimeSeconds: last.time,
        limit: PREFETCH_BATCH_SIZE,
      });

      if (get().mode !== "replay") return;

      if (more.length > 0) {
        engine.appendCandles(more);
        publishStatus();
      }
    } catch (err) {
      if (get().mode !== "replay") return;
      const message =
        err instanceof Error ? err.message : "Prefetch failed";
      set({ replayMessage: message });
    } finally {
      prefetchInFlight = false;
      if (get().mode === "replay") {
        set({ isPrefetching: false });
      }
    }
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
        void maybePrefetch();
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
    prefetchInFlight = false;
    replayRequestId += 1;
    engine.load([]);
    set((s) => ({
      mode: "live",
      replayStatus: "idle",
      isPlaying: false,
      speed: 1,
      replayIndex: 0,
      visibleCandles: [],
      currentCandle: null,
      bufferLength: 0,
      isPrefetching: false,
      replayLoading: false,
      replayMessage: null,
      chartSync: {
        kind: "replace",
        fitContent: true,
        revision: s.chartSync.revision + 1,
      },
    }));
  }

  /**
   * Load a lookback/forward window around `startTimeSeconds` and seek the playhead.
   *
   * @param {number} startTimeSeconds UTC seconds
   * @param {{ clampMessage?: boolean }} [opts]
   */
  async function loadReplayWindow(startTimeSeconds, opts = {}) {
    const startSec = Math.floor(Number(startTimeSeconds));
    if (!Number.isFinite(startSec)) {
      set({ replayMessage: "Invalid start time." });
      return false;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (startSec >= nowSec) {
      set({
        replayMessage: "Start time must be in the past (UTC).",
        replayLoading: false,
      });
      return false;
    }

    const { symbol, timeframe } = get();
    const intervalSec = intervalSecondsFor(timeframe);
    const { startTimeMs, endTimeMs } = buildReplayWindowMs({
      startTimeSeconds: startSec,
      intervalSeconds: intervalSec,
    });

    if (startTimeMs >= endTimeMs) {
      set({
        replayMessage: "Could not build a valid candle window for that time.",
        replayLoading: false,
      });
      return false;
    }

    const requestId = (replayRequestId += 1);
    stopClock();
    set({
      replayLoading: true,
      replayMessage: null,
      error: null,
    });

    try {
      const candles = await fetchCandlesRange({
        symbol,
        interval: timeframe,
        startTime: startTimeMs,
        endTime: endTimeMs,
      });

      if (requestId !== replayRequestId || get().symbol !== symbol) {
        return false;
      }

      if (!candles.length) {
        set({
          replayLoading: false,
          replayMessage: "No candles found for that UTC range.",
        });
        return false;
      }

      engine.load(candles);

      let message = null;
      const firstTime = candles[0].time;

      if (startSec < firstTime) {
        engine.seekToIndex(0);
        if (opts.clampMessage !== false) {
          message = "Start was before the first candle — clamped to buffer start.";
        }
      } else {
        engine.seekToTime(startSec);
      }

      set({
        candles,
        status: "ready",
        replayLoading: false,
        replayMessage: message,
        error: null,
      });
      publishReplay("replace", { fitContent: true });
      void maybePrefetch();
      return true;
    } catch (err) {
      if (requestId !== replayRequestId) return false;

      const message =
        err instanceof Error ? err.message : "Failed to load replay window";
      set({
        replayLoading: false,
        replayMessage: message,
      });
      return false;
    }
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
    bufferLength: 0,
    /** @type {Candle[]} */
    visibleCandles: [],
    /** @type {Candle | null} */
    currentCandle: null,
    /** @type {ChartSync} */
    chartSync: { kind: "replace", fitContent: true, revision: 0 },

    isPrefetching: false,
    replayLoading: false,
    /** @type {string | null} */
    replayMessage: null,

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
     * Start replay at a UTC time: fetch lookback + forward buffer, then seek.
     *
     * @param {number} startTimeSeconds
     */
    async startReplayAt(startTimeSeconds) {
      await loadReplayWindow(startTimeSeconds);
    },

    /**
     * Jump playhead to a UTC time. Fetches a new window when outside the buffer.
     *
     * @param {number} timeSeconds
     */
    async jumpToTime(timeSeconds) {
      if (get().mode !== "replay") return;

      const target = Math.floor(Number(timeSeconds));
      if (!Number.isFinite(target)) {
        set({ replayMessage: "Invalid jump time." });
        return;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      if (target >= nowSec) {
        set({ replayMessage: "Jump time must be in the past (UTC)." });
        return;
      }

      stopClock();
      engine.pause();
      publishStatus();

      const buffer = engine.getState().candles;
      if (buffer.length) {
        const first = buffer[0].time;
        const last = buffer[buffer.length - 1].time;

        if (target >= first && target <= last) {
          const found = findIndexAtOrBefore(buffer, target);
          engine.seekToIndex(found < 0 ? 0 : found);
          set({ replayMessage: null });
          publishReplay("replace", { fitContent: true });
          void maybePrefetch();
          return;
        }
      }

      await loadReplayWindow(target);
    },

    exitReplay() {
      resetReplayState();
      get().loadCandles();
    },

    play() {
      if (get().mode !== "replay") return;
      if (engine.getState().status === "ended") return;
      if (get().replayLoading) return;

      engine.play();
      publishStatus();
      startClock();
      void maybePrefetch();
    },

    pause() {
      if (get().mode !== "replay") return;

      engine.pause();
      stopClock();
      publishStatus();
    },

    stepForward() {
      if (get().mode !== "replay") return;
      if (get().replayLoading) return;

      stopClock();
      engine.pause();

      const before = engine.getState().index;
      engine.stepForward();
      const after = engine.getState().index;

      publishReplay(after > before ? "append" : "replace", {
        fitContent: false,
      });
      void maybePrefetch();
    },

    stepBackward() {
      if (get().mode !== "replay") return;
      if (get().replayLoading) return;

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
