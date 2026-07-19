"use client";

import SymbolSelect from "@/components/SymbolSelect";
import TimeframeSelect from "@/components/TimeframeSelect";
import { useReplayStore } from "@/store/replayStore";

/**
 * App chrome: header, selectors, minimal replay controls, chart slot.
 *
 * @param {{ children: import("react").ReactNode }} props
 */
export default function AppShell({ children }) {
  const status = useReplayStore((s) => s.status);
  const error = useReplayStore((s) => s.error);
  const candles = useReplayStore((s) => s.candles);
  const mode = useReplayStore((s) => s.mode);
  const replayStatus = useReplayStore((s) => s.replayStatus);
  const isPlaying = useReplayStore((s) => s.isPlaying);
  const speed = useReplayStore((s) => s.speed);
  const replayIndex = useReplayStore((s) => s.replayIndex);
  const enterReplay = useReplayStore((s) => s.enterReplay);
  const exitReplay = useReplayStore((s) => s.exitReplay);
  const play = useReplayStore((s) => s.play);
  const pause = useReplayStore((s) => s.pause);
  const stepForward = useReplayStore((s) => s.stepForward);
  const stepBackward = useReplayStore((s) => s.stepBackward);

  const canReplay = status === "ready" && candles.length > 0;
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

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <SymbolSelect />
        <TimeframeSelect />

        <div className="flex flex-wrap items-center gap-2">
          {!inReplay && (
            <button
              type="button"
              disabled={!canReplay}
              onClick={() => enterReplay()}
              className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-amber-500/60 enabled:hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enter replay
            </button>
          )}

          {inReplay && (
            <>
              {!isPlaying ? (
                <button
                  type="button"
                  disabled={replayStatus === "ended"}
                  onClick={play}
                  className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-amber-500/60 enabled:hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Play
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pause}
                  className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 hover:border-amber-500/60 hover:text-amber-300"
                >
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={stepBackward}
                disabled={replayIndex <= 0}
                className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Step −
              </button>
              <button
                type="button"
                onClick={stepForward}
                disabled={replayStatus === "ended"}
                className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Step +
              </button>
              <button
                type="button"
                onClick={exitReplay}
                className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              >
                Exit
              </button>
            </>
          )}
        </div>

        <div className="ml-auto text-xs text-zinc-500">
          {status === "loading" && <span>Loading candles…</span>}
          {status === "ready" && !inReplay && (
            <span>{candles.length.toLocaleString()} candles</span>
          )}
          {inReplay && (
            <span>
              {replayStatus}
              {isPlaying ? ` · ${speed}x` : ""}
              {" · "}
              {replayIndex + 1}/{candles.length}
            </span>
          )}
          {status === "error" && (
            <span className="text-red-400">{error || "Load failed"}</span>
          )}
          {status === "idle" && <span>Waiting to load…</span>}
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
          {status === "loading" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70 text-sm text-zinc-400">
              Loading candles…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
