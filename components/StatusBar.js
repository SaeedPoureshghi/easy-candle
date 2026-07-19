"use client";

import { formatUtcCandleTime } from "@/lib/utcDateTime";
import { useReplayStore } from "@/store/replayStore";

export default function StatusBar() {
  const status = useReplayStore((s) => s.status);
  const error = useReplayStore((s) => s.error);
  const candles = useReplayStore((s) => s.candles);
  const mode = useReplayStore((s) => s.mode);
  const replayStatus = useReplayStore((s) => s.replayStatus);
  const isPlaying = useReplayStore((s) => s.isPlaying);
  const speed = useReplayStore((s) => s.speed);
  const replayIndex = useReplayStore((s) => s.replayIndex);
  const bufferLength = useReplayStore((s) => s.bufferLength);
  const currentCandle = useReplayStore((s) => s.currentCandle);
  const isPrefetching = useReplayStore((s) => s.isPrefetching);
  const replayLoading = useReplayStore((s) => s.replayLoading);
  const replayMessage = useReplayStore((s) => s.replayMessage);

  if (mode === "replay") {
    const parts = [
      replayStatus,
      isPlaying ? `${speed}x` : null,
      formatUtcCandleTime(currentCandle?.time),
      `${replayIndex + 1}/${bufferLength || candles.length}`,
      replayLoading ? "loading window…" : null,
      isPrefetching ? "prefetching…" : null,
    ].filter(Boolean);

    return (
      <div className="ml-auto flex flex-col items-end gap-0.5 text-xs text-zinc-500">
        <span>{parts.join(" · ")}</span>
        {replayMessage && (
          <span className="text-amber-400/90">{replayMessage}</span>
        )}
      </div>
    );
  }

  return (
    <div className="ml-auto text-xs text-zinc-500">
      {status === "loading" && <span>Loading candles…</span>}
      {status === "ready" && (
        <span>{candles.length.toLocaleString()} candles</span>
      )}
      {status === "error" && (
        <span className="text-red-400">{error || "Load failed"}</span>
      )}
      {status === "idle" && <span>Waiting to load…</span>}
    </div>
  );
}
