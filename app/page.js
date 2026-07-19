"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import { buildOverlays } from "@/lib/indicators";
import { useReplayStore } from "@/store/replayStore";

const CandleChart = dynamic(() => import("@/components/CandleChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-zinc-500">
      Loading chart…
    </div>
  ),
});

export default function HomePage() {
  const candles = useReplayStore((s) => s.candles);
  const mode = useReplayStore((s) => s.mode);
  const visibleCandles = useReplayStore((s) => s.visibleCandles);
  const currentCandle = useReplayStore((s) => s.currentCandle);
  const chartSync = useReplayStore((s) => s.chartSync);
  const activeIndicators = useReplayStore((s) => s.activeIndicators);
  const tradeMarkers = useReplayStore((s) => s.tradeMarkers);
  const loadCandles = useReplayStore((s) => s.loadCandles);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  const overlaySource =
    mode === "replay" ? visibleCandles ?? [] : candles ?? [];

  const overlays = useMemo(
    () => buildOverlays(overlaySource, activeIndicators),
    [overlaySource, activeIndicators],
  );

  return (
    <AppShell>
      <CandleChart
        mode={mode}
        candles={candles}
        visibleCandles={visibleCandles}
        currentCandle={currentCandle}
        chartSync={chartSync}
        overlays={overlays}
        tradeMarkers={tradeMarkers}
      />
    </AppShell>
  );
}
