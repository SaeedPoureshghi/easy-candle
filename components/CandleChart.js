"use client";

import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import DrawingOverlay from "@/components/DrawingOverlay";

/** How many candles to keep left of the latest bar when applying the default zoom. */
const DEFAULT_VISIBLE_BARS = 50;

/**
 * @typedef {{ time: number, open: number, high: number, low: number, close: number }} Candle
 * @typedef {'replace' | 'append'} ChartSyncKind
 * @typedef {{ kind: ChartSyncKind, fitContent: boolean, revision: number }} ChartSync
 * @typedef {{ time: number, value: number }} OverlayPoint
 * @typedef {{ id: string, type: 'line', data: OverlayPoint[], color?: string }} ChartOverlay
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
 *   overlays?: ChartOverlay[] | null,
 *   tradeMarkers?: Array<{
 *     time: number,
 *     position: 'aboveBar' | 'belowBar',
 *     color: string,
 *     shape: 'arrowUp' | 'arrowDown',
 *     text: string,
 *   }> | null,
 * }} props
 */
export default function CandleChart({
  mode = "live",
  candles = null,
  visibleCandles = null,
  currentCandle = null,
  chartSync = null,
  overlays = null,
  tradeMarkers = null,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  /** @type {import('react').MutableRefObject<Map<string, import('lightweight-charts').ISeriesApi<'Line'>>>} */
  const overlaySeriesRef = useRef(new Map());
  const [chartReady, setChartReady] = useState(
    /** @type {{ chart: import('lightweight-charts').IChartApi, series: import('lightweight-charts').ISeriesApi<'Candlestick'> } | null} */ (
      null
    ),
  );

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

  /**
   * @param {ChartOverlay[] | null | undefined} nextOverlays
   */
  function syncOverlays(nextOverlays) {
    const chart = chartRef.current;
    if (!chart) return;

    const list = Array.isArray(nextOverlays) ? nextOverlays : [];
    const nextIds = new Set(list.map((item) => item.id));
    const map = overlaySeriesRef.current;

    for (const [id, series] of map.entries()) {
      if (!nextIds.has(id)) {
        chart.removeSeries(series);
        map.delete(id);
      }
    }

    for (const overlay of list) {
      if (overlay.type !== "line") continue;

      let series = map.get(overlay.id);
      if (!series) {
        series = chart.addLineSeries({
          color: overlay.color || "#38bdf8",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        map.set(overlay.id, series);
      } else if (overlay.color) {
        series.applyOptions({ color: overlay.color });
      }

      series.setData(overlay.data ?? []);
    }
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
    setChartReady({ chart, series });

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
      overlaySeriesRef.current.clear();
      setChartReady(null);
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

  useEffect(() => {
    syncOverlays(overlays);
  }, [overlays]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const markers = Array.isArray(tradeMarkers) ? tradeMarkers : [];
    // lightweight-charts requires markers sorted by time.
    const sorted = [...markers].sort((a, b) => a.time - b.time);
    series.setMarkers(sorted);
  }, [tradeMarkers]);

  const empty =
    mode === "live"
      ? !(candles && candles.length)
      : !(visibleCandles && visibleCandles.length);

  return (
    <div className="absolute inset-0 h-full w-full">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {chartReady && (
        <DrawingOverlay chart={chartReady.chart} series={chartReady.series} />
      )}
      {empty && (
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-zinc-950/40 px-4 text-center text-sm text-zinc-500">
          {mode === "replay"
            ? "No candles in this replay window yet."
            : "No candles to display."}
        </div>
      )}
    </div>
  );
}
