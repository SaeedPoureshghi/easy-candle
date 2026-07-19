"use client";

import { useCallback, useEffect, useState } from "react";
import { useReplayStore } from "@/store/replayStore";

/**
 * SVG drawing layer synced to lightweight-charts pan/zoom.
 *
 * @param {{
 *   chart: import('lightweight-charts').IChartApi | null,
 *   series: import('lightweight-charts').ISeriesApi<'Candlestick'> | null,
 * }} props
 */
export default function DrawingOverlay({ chart, series }) {
  const drawings = useReplayStore((s) => s.drawings);
  const drawTool = useReplayStore((s) => s.drawTool);
  const pendingTrend = useReplayStore((s) => s.pendingTrend);
  const addHorizontalLine = useReplayStore((s) => s.addHorizontalLine);
  const addTrendPoint = useReplayStore((s) => s.addTrendPoint);
  const mode = useReplayStore((s) => s.mode);
  const replayStatus = useReplayStore((s) => s.replayStatus);

  const [version, setVersion] = useState(0);
  const [hover, setHover] = useState(/** @type {{ x: number, y: number } | null} */ (null));

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!chart) return undefined;

    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(bump);
    timeScale.subscribeVisibleTimeRangeChange(bump);
    chart.subscribeCrosshairMove(bump);

    const ro = new ResizeObserver(bump);
    const el = chart.chartElement();
    if (el) ro.observe(el);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(bump);
      timeScale.unsubscribeVisibleTimeRangeChange(bump);
      chart.unsubscribeCrosshairMove(bump);
      ro.disconnect();
    };
  }, [chart, bump]);

  const interactive =
    mode === "replay" &&
    replayStatus !== "ended" &&
    (drawTool === "hline" || drawTool === "trendline");

  /**
   * @param {React.MouseEvent<SVGSVGElement>} event
   */
  function onClick(event) {
    if (!interactive || !chart || !series) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const price = series.coordinateToPrice(y);
    const time = chart.timeScale().coordinateToTime(x);

    if (price == null || time == null) return;

    const timeSec = typeof time === "number" ? time : Number(time);
    if (!Number.isFinite(timeSec) || !Number.isFinite(price)) return;

    if (drawTool === "hline") {
      addHorizontalLine(price);
      return;
    }

    if (drawTool === "trendline") {
      addTrendPoint({ time: timeSec, price });
    }
  }

  /**
   * @param {React.MouseEvent<SVGSVGElement>} event
   */
  function onMove(event) {
    if (!interactive) {
      setHover(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setHover({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  // Touch version so React doesn't drop redraw deps for lint.
  void version;

  const width = chart?.chartElement()?.clientWidth ?? 0;
  const height = chart?.chartElement()?.clientHeight ?? 0;

  /**
   * @param {number} time
   * @param {number} price
   */
  function toXY(time, price) {
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(/** @type {any} */ (time));
    const y = series.priceToCoordinate(price);
    if (x == null || y == null) return null;
    return { x, y };
  }

  return (
    <svg
      className={`absolute inset-0 z-[2] h-full w-full ${
        interactive ? "cursor-crosshair" : "pointer-events-none"
      }`}
      width={width || "100%"}
      height={height || "100%"}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {drawings.map((drawing) => {
        if (drawing.type === "hline") {
          const y = series?.priceToCoordinate(drawing.price);
          if (y == null) return null;
          return (
            <line
              key={drawing.id}
              x1={0}
              x2={width || "100%"}
              y1={y}
              y2={y}
              stroke="#fbbf24"
              strokeWidth={1.25}
              strokeDasharray="6 4"
            />
          );
        }

        if (drawing.type === "trendline") {
          const a = toXY(drawing.t1, drawing.p1);
          const b = toXY(drawing.t2, drawing.p2);
          if (!a || !b) return null;
          return (
            <line
              key={drawing.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#a78bfa"
              strokeWidth={1.5}
            />
          );
        }

        return null;
      })}

      {pendingTrend &&
        (() => {
          const a = toXY(pendingTrend.time, pendingTrend.price);
          if (!a) return null;
          return (
            <g key="pending">
              <circle cx={a.x} cy={a.y} r={3.5} fill="#a78bfa" />
              {hover && (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={hover.x}
                  y2={hover.y}
                  stroke="#a78bfa"
                  strokeWidth={1.25}
                  strokeDasharray="4 3"
                />
              )}
            </g>
          );
        })()}
    </svg>
  );
}
