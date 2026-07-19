"use client";

import SymbolSelect from "@/components/SymbolSelect";
import TimeframeSelect from "@/components/TimeframeSelect";
import { useReplayStore } from "@/store/replayStore";

/**
 * App chrome: header, live selectors, loading/error, chart slot.
 *
 * @param {{ children: import("react").ReactNode }} props
 */
export default function AppShell({ children }) {
  const status = useReplayStore((s) => s.status);
  const error = useReplayStore((s) => s.error);
  const candles = useReplayStore((s) => s.candles);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight text-amber-400">
            Easy Candle
          </h1>
          <p className="text-xs text-zinc-500">Live chart · UTC</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <SymbolSelect />
        <TimeframeSelect />

        <div className="ml-auto text-xs text-zinc-500">
          {status === "loading" && <span>Loading candles…</span>}
          {status === "ready" && (
            <span>
              {candles.length.toLocaleString()} candles
            </span>
          )}
          {status === "error" && (
            <span className="text-red-400">{error || "Load failed"}</span>
          )}
          {status === "idle" && <span>Waiting to load…</span>}
        </div>
      </div>

      {status === "error" && error && (
        <div className="border-b border-red-900/50 bg-red-950/40 px-4 py-2 text-sm text-red-300 sm:px-6">
          {error}
        </div>
      )}

      <main className="relative flex flex-1 flex-col p-4 sm:p-6">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
          {children}
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 text-sm text-zinc-400">
              Loading candles…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
