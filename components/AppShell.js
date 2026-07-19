"use client";

import ReplayControls from "@/components/ReplayControls";
import ReplayStartPicker from "@/components/ReplayStartPicker";
import StatusBar from "@/components/StatusBar";
import SymbolSelect from "@/components/SymbolSelect";
import TimeframeSelect from "@/components/TimeframeSelect";
import { useReplayStore } from "@/store/replayStore";

/**
 * App chrome: header, selectors, replay UX, chart slot.
 *
 * @param {{ children: import("react").ReactNode }} props
 */
export default function AppShell({ children }) {
  const status = useReplayStore((s) => s.status);
  const error = useReplayStore((s) => s.error);
  const mode = useReplayStore((s) => s.mode);
  const replayLoading = useReplayStore((s) => s.replayLoading);

  const inReplay = mode === "replay";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight text-amber-400">
            Easy Candle
          </h1>
          <p className="text-xs text-zinc-500">
            {inReplay ? "Replay · UTC" : "Live chart · UTC"}
          </p>
        </div>
      </header>

      <div className="flex shrink-0 flex-col gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <SymbolSelect />
          <TimeframeSelect />
          <StatusBar />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!inReplay ? <ReplayStartPicker /> : <ReplayControls />}
        </div>
      </div>

      {status === "error" && error && (
        <div className="shrink-0 border-b border-red-900/50 bg-red-950/40 px-4 py-2 text-sm text-red-300 sm:px-6">
          {error}
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col p-2 sm:p-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
          {children}
          {(status === "loading" || replayLoading) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70 text-sm text-zinc-400">
              {replayLoading ? "Loading replay window…" : "Loading candles…"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
