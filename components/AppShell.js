"use client";

import { useEffect } from "react";
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
  const replayStatus = useReplayStore((s) => s.replayStatus);
  const candles = useReplayStore((s) => s.candles);
  const pause = useReplayStore((s) => s.pause);
  const loadCandles = useReplayStore((s) => s.loadCandles);

  const inReplay = mode === "replay";
  const showEmptyLive =
    !inReplay && status === "ready" && candles.length === 0;
  const showEndedBanner = inReplay && replayStatus === "ended";

  // Pause the replay clock when the tab is hidden (battery / focus).
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        const state = useReplayStore.getState();
        if (state.mode === "replay" && state.isPlaying) {
          pause();
        }
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

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
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-red-900/50 bg-red-950/40 px-4 py-2 text-sm text-red-300 sm:px-6">
          <span>{error}</span>
          {!inReplay && (
            <button
              type="button"
              onClick={() => loadCandles()}
              className="rounded border border-red-800/80 px-2 py-0.5 text-xs text-red-200 hover:border-red-600 hover:text-red-100"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {showEndedBanner && (
        <div className="shrink-0 border-b border-amber-900/40 bg-amber-950/30 px-4 py-1.5 text-xs text-amber-200/90 sm:px-6">
          Replay reached the end of the loaded buffer. Jump to another UTC time,
          step back, or exit to live.
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col p-2 sm:p-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
          {children}
          {(status === "loading" || replayLoading) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-950/75 text-sm text-zinc-400">
              <span>
                {replayLoading ? "Loading replay window…" : "Loading candles…"}
              </span>
              <span className="text-xs text-zinc-600">UTC · Binance klines</span>
            </div>
          )}
          {showEmptyLive && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-zinc-950/60 px-4 text-center text-sm text-zinc-400">
              <span>No candles for this symbol / timeframe.</span>
              <button
                type="button"
                onClick={() => loadCandles()}
                className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
              >
                Reload
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
