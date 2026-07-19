"use client";

import { useState } from "react";
import { defaultUtcParts, parseUtcParts } from "@/lib/utcDateTime";
import { useReplayStore } from "@/store/replayStore";

export default function ReplayStartPicker() {
  const status = useReplayStore((s) => s.status);
  const mode = useReplayStore((s) => s.mode);
  const replayLoading = useReplayStore((s) => s.replayLoading);
  const startReplayAt = useReplayStore((s) => s.startReplayAt);

  const initial = defaultUtcParts(7);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [localError, setLocalError] = useState(/** @type {string | null} */ (null));

  const disabled =
    status === "loading" || replayLoading || mode === "replay";

  async function onSubmit(event) {
    event.preventDefault();
    setLocalError(null);

    const seconds = parseUtcParts(date, time);
    if (seconds == null) {
      setLocalError("Enter a valid UTC date and time.");
      return;
    }

    await startReplayAt(seconds);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2 text-sm text-zinc-400"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">
          Start date (UTC)
        </span>
        <input
          type="date"
          value={date}
          disabled={disabled}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 disabled:opacity-60"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">
          Start time (UTC)
        </span>
        <input
          type="time"
          value={time}
          disabled={disabled}
          onChange={(e) => setTime(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={disabled || status !== "ready"}
        className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200 enabled:hover:border-amber-500/60 enabled:hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {replayLoading && mode !== "replay" ? "Loading…" : "Start replay"}
      </button>

      {localError && (
        <span className="text-xs text-red-400">{localError}</span>
      )}
    </form>
  );
}
