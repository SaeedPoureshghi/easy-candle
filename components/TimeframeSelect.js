"use client";

import { TIMEFRAME_IDS, TIMEFRAMES } from "@/lib/timeframes";
import { useReplayStore } from "@/store/replayStore";

export default function TimeframeSelect() {
  const timeframe = useReplayStore((s) => s.timeframe);
  const status = useReplayStore((s) => s.status);
  const setTimeframe = useReplayStore((s) => s.setTimeframe);
  const disabled = status === "loading";

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-400">
      <span>Timeframe</span>
      <select
        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 disabled:opacity-60"
        value={timeframe}
        disabled={disabled}
        onChange={(event) => setTimeframe(event.target.value)}
      >
        {TIMEFRAME_IDS.map((id) => (
          <option key={id} value={id}>
            {TIMEFRAMES[id].label}
          </option>
        ))}
      </select>
    </label>
  );
}
