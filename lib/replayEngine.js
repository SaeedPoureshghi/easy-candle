/**
 * Pure replay state machine — no React, DOM, or timers.
 * The play clock lives outside (store/hook) and calls `stepForward`.
 *
 * @typedef {import('./candleUtils').Candle} Candle
 * @typedef {'idle' | 'ready' | 'playing' | 'paused' | 'ended'} ReplayStatus
 * @typedef {{
 *   candles: Candle[],
 *   index: number,
 *   isPlaying: boolean,
 *   speed: number,
 *   status: ReplayStatus,
 * }} ReplayState
 */

import { dedupeCandlesByTime, findIndexAtOrBefore } from "./candleUtils";

/** @type {readonly number[]} */
export const REPLAY_SPEEDS = Object.freeze([0.5, 1, 2, 4]);

const DEFAULT_SPEED = 1;
const DEFAULT_PREFETCH_THRESHOLD = 50;

/**
 * @param {number} value
 * @returns {number}
 */
function normalizeSpeed(value) {
  const n = Number(value);
  if (REPLAY_SPEEDS.includes(n)) return n;
  return DEFAULT_SPEED;
}

/**
 * @param {unknown} candles
 * @returns {Candle[]}
 */
function normalizeCandles(candles) {
  if (!Array.isArray(candles)) return [];
  return dedupeCandlesByTime(
    /** @type {Candle[]} */ (
      candles.filter(
        (c) =>
          c &&
          typeof c === "object" &&
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close),
      )
    ),
  );
}

/**
 * @param {{ prefetchThreshold?: number, speed?: number }} [options]
 */
export function createReplayEngine(options = {}) {
  const prefetchThreshold =
    Number.isFinite(options.prefetchThreshold) && options.prefetchThreshold >= 0
      ? Math.floor(options.prefetchThreshold)
      : DEFAULT_PREFETCH_THRESHOLD;

  /** @type {Candle[]} */
  let candles = [];
  let index = 0;
  let isPlaying = false;
  let speed = normalizeSpeed(options.speed);
  /** @type {ReplayStatus} */
  let status = "idle";

  function lastIndex() {
    return candles.length - 1;
  }

  function hasCandles() {
    return candles.length > 0;
  }

  /**
   * @returns {ReplayState}
   */
  function getState() {
    return {
      candles: candles.slice(),
      index,
      isPlaying,
      speed,
      status,
    };
  }

  /**
   * Replace the candle buffer and reset playback to the first candle.
   *
   * @param {Candle[]} nextCandles
   * @returns {ReplayState}
   */
  function load(nextCandles) {
    candles = normalizeCandles(nextCandles);
    index = 0;
    isPlaying = false;
    status = hasCandles() ? "ready" : "idle";
    return getState();
  }

  /**
   * @returns {ReplayState}
   */
  function play() {
    if (!hasCandles() || status === "ended") return getState();
    isPlaying = true;
    status = "playing";
    return getState();
  }

  /**
   * @returns {ReplayState}
   */
  function pause() {
    if (!hasCandles()) return getState();
    if (status === "ended") {
      isPlaying = false;
      return getState();
    }
    isPlaying = false;
    status = "paused";
    return getState();
  }

  /**
   * Advance one candle. At the last candle, a further step sets `ended`.
   *
   * @returns {ReplayState}
   */
  function stepForward() {
    if (!hasCandles()) return getState();

    if (index >= lastIndex()) {
      isPlaying = false;
      status = "ended";
      return getState();
    }

    index += 1;
    status = isPlaying ? "playing" : "paused";
    return getState();
  }

  /**
   * @returns {ReplayState}
   */
  function stepBackward() {
    if (!hasCandles()) return getState();

    if (index > 0) {
      index -= 1;
    }

    isPlaying = false;
    status = "paused";
    return getState();
  }

  /**
   * @param {number} nextSpeed
   * @returns {ReplayState}
   */
  function setSpeed(nextSpeed) {
    speed = normalizeSpeed(nextSpeed);
    return getState();
  }

  /**
   * @param {number} nextIndex
   * @returns {ReplayState}
   */
  function seekToIndex(nextIndex) {
    if (!hasCandles()) return getState();

    const n = Number(nextIndex);
    if (!Number.isFinite(n)) return getState();

    index = Math.min(lastIndex(), Math.max(0, Math.floor(n)));
    isPlaying = false;
    status = "paused";
    return getState();
  }

  /**
   * Seek to the candle at or before `timeSeconds` (UTC seconds).
   * Times before the first candle clamp to index 0.
   *
   * @param {number} timeSeconds
   * @returns {ReplayState}
   */
  function seekToTime(timeSeconds) {
    if (!hasCandles()) return getState();

    const found = findIndexAtOrBefore(candles, timeSeconds);
    return seekToIndex(found < 0 ? 0 : found);
  }

  /**
   * Candles from the start of the buffer through the current index (inclusive).
   *
   * @returns {Candle[]}
   */
  function getVisibleCandles() {
    if (!hasCandles()) return [];
    return candles.slice(0, index + 1);
  }

  /**
   * @returns {Candle | null}
   */
  function getCurrentCandle() {
    if (!hasCandles()) return null;
    return candles[index] ?? null;
  }

  /**
   * True when the playhead is within `prefetchThreshold` candles of the buffer end.
   *
   * @returns {boolean}
   */
  function needsPrefetch() {
    if (!hasCandles() || status === "idle") return false;
    const remaining = lastIndex() - index;
    return remaining <= prefetchThreshold;
  }

  /**
   * Extend the buffer forward without resetting `index`.
   * If the engine had ended because the buffer ran out, status returns to `paused`.
   *
   * @param {Candle[]} more
   * @returns {ReplayState}
   */
  function appendCandles(more) {
    if (!Array.isArray(more) || more.length === 0) return getState();

    const incoming = normalizeCandles(more);
    if (incoming.length === 0) return getState();

    const previousLast = hasCandles() ? candles[lastIndex()].time : null;
    const extensions =
      previousLast == null
        ? incoming
        : incoming.filter((c) => c.time > previousLast);

    if (extensions.length === 0) return getState();

    const wasEnded = status === "ended";
    candles = dedupeCandlesByTime(candles.concat(extensions));

    if (!hasCandles()) {
      index = 0;
      isPlaying = false;
      status = "idle";
      return getState();
    }

    if (index > lastIndex()) {
      index = lastIndex();
    }

    if (wasEnded && index < lastIndex()) {
      isPlaying = false;
      status = "paused";
    }

    return getState();
  }

  return {
    getState,
    load,
    play,
    pause,
    stepForward,
    stepBackward,
    setSpeed,
    seekToIndex,
    seekToTime,
    getVisibleCandles,
    getCurrentCandle,
    needsPrefetch,
    appendCandles,
  };
}
