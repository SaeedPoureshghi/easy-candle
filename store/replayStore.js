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
import { getIndicator } from "@/lib/indicators";
import {
  closePosition,
  openPosition,
  summarizeSession,
} from "@/lib/paperTrade";
import { createReplayEngine } from "@/lib/replayEngine";
import { DEFAULT_SYMBOL } from "@/lib/symbols";
import {
  alignTimeToInterval,
  DEFAULT_TIMEFRAME,
  TIMEFRAMES,
} from "@/lib/timeframes";

/**
 * @typedef {'idle' | 'loading' | 'ready' | 'error'} ChartStatus
 * @typedef {'live' | 'replay'} ViewMode
 * @typedef {'replace' | 'append'} ChartSyncKind
 * @typedef {'idle' | 'ready' | 'playing' | 'paused' | 'ended'} ReplayStatus
 * @typedef {'select' | 'hline' | 'trendline'} DrawTool
 * @typedef {import("@/lib/candleUtils").Candle} Candle
 * @typedef {{ kind: ChartSyncKind, fitContent: boolean, revision: number }} ChartSync
 * @typedef {{ id: string, type: 'hline', price: number }} HLineDrawing
 * @typedef {{ id: string, type: 'trendline', t1: number, p1: number, t2: number, p2: number }} TrendDrawing
 * @typedef {HLineDrawing | TrendDrawing} Drawing
 * @typedef {{ time: number, price: number }} TrendPoint
 * @typedef {import("@/lib/paperTrade").Position} Position
 * @typedef {import("@/lib/paperTrade").ClosedTrade} ClosedTrade
 * @typedef {import("@/lib/paperTrade").SessionSummary} SessionSummary
 * @typedef {{
 *   time: number,
 *   position: 'aboveBar' | 'belowBar',
 *   color: string,
 *   shape: 'arrowUp' | 'arrowDown',
 *   text: string,
 * }} TradeMarker
 * @typedef {{
 *   symbol: string,
 *   timeframe: string,
 *   trades: ClosedTrade[],
 *   summary: SessionSummary,
 *   closedOpenOnExit: boolean,
 * }} SessionReport
 */

let drawingSeq = 0;
let tradeSeq = 0;

function nextDrawingId() {
  drawingSeq += 1;
  return `d-${drawingSeq}`;
}

function nextTradeId() {
  tradeSeq += 1;
  return `t-${tradeSeq}`;
}

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
      drawTool: "select",
      drawings: [],
      pendingTrend: null,
      position: null,
      closedTrades: [],
      tradeMarkers: [],
      chartSync: {
        kind: "replace",
        fitContent: true,
        revision: s.chartSync.revision + 1,
      },
    }));
  }

  /**
   * @param {'long' | 'short'} side
   */
  function tryOpen(side) {
    if (get().mode !== "replay") return;
    if (get().replayLoading) return;
    if (get().replayStatus === "ended") return;

    const candle = engine.getCurrentCandle() || get().currentCandle;
    if (!candle) return;

    const result = openPosition(
      get().position,
      side,
      candle.close,
      candle.time,
      nextTradeId(),
    );
    if (!result.ok) {
      set({ replayMessage: result.reason });
      return;
    }

    /** @type {TradeMarker} */
    const marker = {
      time: candle.time,
      position: side === "long" ? "belowBar" : "aboveBar",
      color: side === "long" ? "#22c55e" : "#ef4444",
      shape: side === "long" ? "arrowUp" : "arrowDown",
      text: side === "long" ? "B" : "S",
    };

    set((s) => ({
      position: result.position,
      tradeMarkers: [...s.tradeMarkers, marker],
      replayMessage: null,
    }));
  }

  function tryClose() {
    if (get().mode !== "replay") return;
    if (get().replayLoading) return;
    if (get().replayStatus === "ended") return;

    const open = get().position;
    if (!open) return;

    const candle = engine.getCurrentCandle() || get().currentCandle;
    if (!candle) return;

    const closed = closePosition(open, candle.close, candle.time);

    set((s) => ({
      position: null,
      closedTrades: [...s.closedTrades, closed],
      replayMessage: null,
    }));
  }

  /**
   * Load a lookback/forward window around `startTimeSeconds` and seek the playhead.
   *
   * @param {number} startTimeSeconds UTC seconds
   * @param {{ clampMessage?: boolean, message?: string | null }} [opts]
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
    const expectedTimeframe = timeframe;
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

      if (
        requestId !== replayRequestId ||
        get().symbol !== symbol ||
        get().timeframe !== expectedTimeframe
      ) {
        return false;
      }

      if (!candles.length) {
        set({
          replayLoading: false,
          replayMessage: "No candles found for that UTC range.",
        });
        return false;
      }

      // Keep playback speed across timeframe remaps / window reloads.
      const keptSpeed = engine.getState().speed;
      engine.load(candles);
      engine.setSpeed(keptSpeed);

      let message = opts.message ?? null;
      const firstTime = candles[0].time;

      if (startSec < firstTime) {
        engine.seekToIndex(0);
        if (opts.clampMessage !== false) {
          message =
            message ||
            "Start was before the first candle — clamped to buffer start.";
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
        speed: engine.getState().speed,
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

  /**
   * Remap replay onto another timeframe without exiting replay.
   * Anchor = current candle open; seek uses at-or-before on the new series
   * (larger→smaller lands on the first child candle; smaller→larger on the parent).
   *
   * @param {string} nextTimeframe
   */
  async function switchReplayTimeframe(nextTimeframe) {
    if (!TIMEFRAMES[nextTimeframe]) return;
    if (nextTimeframe === get().timeframe) return;
    if (get().mode !== "replay") return;

    const current = engine.getCurrentCandle() || get().currentCandle;
    const anchorOpen = current?.time;
    if (anchorOpen == null || !Number.isFinite(anchorOpen)) {
      set({
        replayMessage: "Cannot switch timeframe without a current candle.",
      });
      return;
    }

    stopClock();
    engine.pause();
    publishStatus();

    const previousTimeframe = get().timeframe;
    const nextIntervalSec = intervalSecondsFor(nextTimeframe);
    // Align to the new TF open so 4h→15m seeks the first 15m of that 4h bar,
    // and 15m→4h seeks the parent 4h that contains the playhead.
    const seekTime = alignTimeToInterval(anchorOpen, nextIntervalSec);

    // Drawings/markers are time-scale bound. Realize any open trade into
    // session history, keep closedTrades, clear chart markers.
    const open = get().position;
    const candle = engine.getCurrentCandle() || get().currentCandle;
    /** @type {ClosedTrade[]} */
    let nextClosed = get().closedTrades;
    if (open && candle) {
      nextClosed = [...nextClosed, closePosition(open, candle.close, candle.time)];
    }

    set({
      timeframe: nextTimeframe,
      drawings: [],
      pendingTrend: null,
      drawTool: "select",
      position: null,
      closedTrades: nextClosed,
      tradeMarkers: [],
    });

    const ok = await loadReplayWindow(seekTime, {
      clampMessage: true,
      message: `Timeframe → ${nextTimeframe} (UTC playhead kept).`,
    });

    // Roll back the selector if this request failed and nothing newer took over.
    if (!ok && get().timeframe === nextTimeframe && get().mode === "replay") {
      set({ timeframe: previousTimeframe });
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

    /** @type {string[]} Active overlay indicator ids (e.g. sma20, ema20). */
    activeIndicators: [],

    /** @type {DrawTool} */
    drawTool: "select",
    /** @type {Drawing[]} */
    drawings: [],
    /** @type {TrendPoint | null} */
    pendingTrend: null,

    /**
     * @param {string} id
     */
    toggleIndicator(id) {
      if (!getIndicator(id)) return;
      set((s) => {
        const active = s.activeIndicators.includes(id);
        return {
          activeIndicators: active
            ? s.activeIndicators.filter((item) => item !== id)
            : [...s.activeIndicators, id],
        };
      });
    },

    /**
     * @param {DrawTool} tool
     */
    setDrawTool(tool) {
      if (tool !== "select" && tool !== "hline" && tool !== "trendline") return;
      set({ drawTool: tool, pendingTrend: null });
    },

    /**
     * @param {number} price
     */
    addHorizontalLine(price) {
      if (get().mode !== "replay") return;
      if (get().replayStatus === "ended") return;
      if (!Number.isFinite(price)) return;
      set((s) => ({
        drawings: [
          ...s.drawings,
          { id: nextDrawingId(), type: "hline", price },
        ],
      }));
    },

    /**
     * @param {TrendPoint} point
     */
    addTrendPoint(point) {
      if (get().mode !== "replay") return;
      if (get().replayStatus === "ended") return;
      if (!point || !Number.isFinite(point.time) || !Number.isFinite(point.price)) {
        return;
      }

      const pending = get().pendingTrend;
      if (!pending) {
        set({ pendingTrend: point });
        return;
      }

      set((s) => ({
        pendingTrend: null,
        drawings: [
          ...s.drawings,
          {
            id: nextDrawingId(),
            type: "trendline",
            t1: pending.time,
            p1: pending.price,
            t2: point.time,
            p2: point.price,
          },
        ],
      }));
    },

    clearDrawings() {
      set({ drawings: [], pendingTrend: null });
    },

    /** @type {Position | null} */
    position: null,
    /** @type {ClosedTrade[]} */
    closedTrades: [],
    /** @type {TradeMarker[]} */
    tradeMarkers: [],
    /** @type {SessionReport | null} */
    sessionReport: null,

    paperBuy() {
      tryOpen("long");
    },

    paperSell() {
      tryOpen("short");
    },

    paperClose() {
      tryClose();
    },

    dismissSessionReport() {
      set({ sessionReport: null });
    },

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
      if (!TIMEFRAMES[timeframe]) return;

      // In replay: keep the playhead time and reload only that TF window.
      if (get().mode === "replay") {
        void switchReplayTimeframe(timeframe);
        return;
      }

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
      const { position, closedTrades, symbol, timeframe, currentCandle } =
        get();

      /** @type {ClosedTrade[]} */
      let trades = [...closedTrades];
      let closedOpenOnExit = false;

      if (position) {
        const candle = engine.getCurrentCandle() || currentCandle;
        if (candle) {
          trades = [
            ...trades,
            closePosition(position, candle.close, candle.time),
          ];
          closedOpenOnExit = true;
        }
      }

      /** @type {SessionReport | null} */
      const sessionReport =
        trades.length > 0
          ? {
              symbol,
              timeframe,
              trades,
              summary: summarizeSession(trades),
              closedOpenOnExit,
            }
          : null;

      resetReplayState();
      set({ sessionReport });
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
