"use client";

import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

/** How many candles to keep left of the latest bar when applying the default zoom. */
const DEFAULT_VISIBLE_BARS = 50;

/**
 * @typedef {{ time: number, open: number, high: number, low: number, close: number }} Candle
 * @typedef {'replace' | 'append'} ChartSyncKind
 * @typedef {{ kind: ChartSyncKind, fitContent: boolean, revision: number }} ChartSync
 */

/**
 * Zoom to the latest candle: ~`leftBars` candles on the left, latest bar centered,
 * matching blank space on the right.
 *
 * @param {import("lightweight-charts").IChartApi} chart
 * @param {number} candleCount
 * @param {number} [leftBars]
 */
function focusLatestCandle(chart, candleCount, leftBars = DEFAULT_VISIBLE_BARS) {
  if (!chart || candleCount <= 0) return;

  const last = candleCount - 1;
  const span = Math.min(leftBars, Math.max(candleCount - 1, 1));

  chart.timeScale().setVisibleLogicalRange({
    from: last - span,
    to: last + span,
  });
}

/**
 * @param {{
 *   mode?: 'live' | 'replay',
 *   candles?: Candle[] | null,
 *   visibleCandles?: Candle[] | null,
 *   currentCandle?: Candle | null,
 *   chartSync?: ChartSync | null,
 * }} props
 */
export default function CandleChart({
  mode = "live",
  candles = null,
  visibleCandles = null,
  currentCandle = null,
  chartSync = null,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  /**
   * @param {Candle[]} [next]
   * @param {{ fitContent?: boolean }} [opts]
   */
  function reset(next = [], opts = {}) {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    const data = next ?? [];
    series.setData(data);

    if (opts.fitContent !== false && data.length) {
      // Apply after layout so the logical range sticks.
      requestAnimationFrame(() => {
        if (chartRef.current === chart) {
          focusLatestCandle(chart, data.length);
        }
      });
    }
  }

  /**
   * @param {Candle} candle
   */
  function append(candle) {
    const series = seriesRef.current;
    if (!series || !candle) return;
    series.update(candle);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: Math.max(container.clientHeight, 1),
      layout: {
        background: { color: "#09090b" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      rightPriceScale: {
        borderColor: "#3f3f46",
      },
      timeScale: {
        borderColor: "#3f3f46",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Live mode: full buffer via setData.
  useEffect(() => {
    if (mode !== "live") return;
    reset(candles ?? [], { fitContent: true });
  }, [mode, candles]);

  // Replay mode: replace on enter/seek/step back; append on play/step forward.
  useEffect(() => {
    if (mode !== "replay" || !chartSync) return;

    if (chartSync.kind === "append" && currentCandle) {
      append(currentCandle);
      return;
    }

    reset(visibleCandles ?? [], { fitContent: chartSync.fitContent });
  }, [mode, chartSync?.revision]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
