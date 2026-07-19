"use client";

import { useState } from "react";
import { REPLAY_SPEEDS } from "@/lib/replayEngine";
import {
  defaultUtcParts,
  parseUtcParts,
  toUtcParts,
} from "@/lib/utcDateTime";
import { useReplayStore } from "@/store/replayStore";

export default function ReplayControls() {
  const replayStatus = useReplayStore((s) => s.replayStatus);
  const isPlaying = useReplayStore((s) => s.isPlaying);
  const speed = useReplayStore((s) => s.speed);
  const replayIndex = useReplayStore((s) => s.replayIndex);
  const replayLoading = useReplayStore((s) => s.replayLoading);
  const currentCandle = useReplayStore((s) => s.currentCandle);
  const play = useReplayStore((s) => s.play);
  const pause = useReplayStore((s) => s.pause);
  const stepForward = useReplayStore((s) => s.stepForward);
  const stepBackward = useReplayStore((s) => s.stepBackward);
  const setSpeed = useReplayStore((s) => s.setSpeed);
  const jumpToTime = useReplayStore((s) => s.jumpToTime);
  const exitReplay = useReplayStore((s) => s.exitReplay);

  const seed = currentCandle
    ? toUtcParts(currentCandle.time)
    : defaultUtcParts(7);
  const [jumpDate, setJumpDate] = useState(seed.date);
  const [jumpTime, setJumpTime] = useState(seed.time);
  const [jumpError, setJumpError] = useState(/** @type {string | null} */ (null));

  const busy = replayLoading;
  const ended = replayStatus === "ended";

  async function onJump(event) {
    event.preventDefault();
    setJumpError(null);

    const seconds = parseUtcParts(jumpDate, jumpTime);
    if (seconds == null) {
      setJumpError("Enter a valid UTC date and time.");
      return;
    }

    await jumpToTime(seconds);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isPlaying ? (
        <button
          type="button"
          disabled={busy || ended}
          onClick={play}
          className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-amber-500/60 enabled:hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Play
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={pause}
          className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 hover:border-amber-500/60 hover:text-amber-300 disabled:opacity-40"
        >
          Pause
        </button>
      )}

      <button
        type="button"
        disabled={busy || replayIndex <= 0}
        onClick={stepBackward}
        className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Step −
      </button>

      <button
        type="button"
        disabled={busy || ended}
        onClick={stepForward}
        className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Step +
      </button>

      <label className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span>Speed</span>
        <select
          value={String(speed)}
          disabled={busy}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-zinc-300 disabled:opacity-60"
        >
          {REPLAY_SPEEDS.map((value) => (
            <option key={value} value={String(value)}>
              {value}x
            </option>
          ))}
        </select>
      </label>

      <form
        onSubmit={onJump}
        className="flex flex-wrap items-center gap-1.5 border-l border-zinc-800 pl-2"
      >
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">
          Jump UTC
        </span>
        <input
          type="date"
          value={jumpDate}
          disabled={busy}
          onChange={(e) => setJumpDate(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-xs text-zinc-300 disabled:opacity-60"
        />
        <input
          type="time"
          value={jumpTime}
          disabled={busy}
          onChange={(e) => setJumpTime(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-xs text-zinc-300 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-200 enabled:hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Jump
        </button>
        {jumpError && (
          <span className="text-xs text-red-400">{jumpError}</span>
        )}
      </form>

      <button
        type="button"
        onClick={exitReplay}
        className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
      >
        Exit
      </button>
    </div>
  );
}
