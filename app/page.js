"use client";

import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import { MOCK_CANDLES } from "@/lib/mockCandles";

const CandleChart = dynamic(() => import("@/components/CandleChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-zinc-500">
      Loading chart…
    </div>
  ),
});

export default function HomePage() {
  return (
    <AppShell>
      <CandleChart candles={MOCK_CANDLES} />
    </AppShell>
  );
}
