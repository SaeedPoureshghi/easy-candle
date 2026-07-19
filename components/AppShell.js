"use client";

import { DEFAULT_SYMBOL, SYMBOLS } from "@/lib/symbols";
import {
  DEFAULT_TIMEFRAME,
  TIMEFRAME_IDS,
  TIMEFRAMES,
} from "@/lib/timeframes";

/**
 * Minimal app chrome: header, disabled control placeholders, chart slot.
 *
 * @param {{ children: import("react").ReactNode }} props
 */
export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight text-amber-400">
            Easy Candle
          </h1>
          <p className="text-xs text-zinc-500">Static chart shell</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Symbol</span>
          <select
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 disabled:opacity-60"
            defaultValue={DEFAULT_SYMBOL.id}
            disabled
          >
            {SYMBOLS.map((symbol) => (
              <option key={symbol.id} value={symbol.id}>
                {symbol.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <span>Timeframe</span>
          <select
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300 disabled:opacity-60"
            defaultValue={DEFAULT_TIMEFRAME}
            disabled
          >
            {TIMEFRAME_IDS.map((id) => (
              <option key={id} value={id}>
                {TIMEFRAMES[id].label}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto text-xs text-zinc-600">
          Selectors disabled until live data
        </div>
      </div>

      <main className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="min-h-0 flex-1 overflow-hidden rounded border border-zinc-800 bg-zinc-950">
          {children}
        </div>
      </main>
    </div>
  );
}
