"use client";

import { SYMBOLS } from "@/lib/symbols";
import { useReplayStore } from "@/store/replayStore";

export default function SymbolSelect() {
  const symbol = useReplayStore((s) => s.symbol);
  const status = useReplayStore((s) => s.status);
  const setSymbol = useReplayStore((s) => s.setSymbol);
  const disabled = status === "loading";

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-400">
      <span>Symbol</span>
      <select
        className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 disabled:opacity-60"
        value={symbol}
        disabled={disabled}
        onChange={(event) => setSymbol(event.target.value)}
      >
        {SYMBOLS.map((entry) => (
          <option key={entry.id} value={entry.binanceSymbol}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}
