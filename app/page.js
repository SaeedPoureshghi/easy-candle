"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
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
  const loadCandles = useReplayStore((s) => s.loadCandles);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  return (
    <AppShell>
      <CandleChart
        mode={mode}
        candles={candles}
        visibleCandles={visibleCandles}
        currentCandle={currentCandle}
        chartSync={chartSync}
      />
    </AppShell>
  );
}
