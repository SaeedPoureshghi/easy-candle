# Session 04 — Real data on chart

**Phase:** 2  
**Branch:** `session/04-real-chart-data`  
**Depends on:** Session 03 `done`

## Goal

Load real BTCUSDT history through the proxy into the chart. Symbol and timeframe selectors work. Introduce an early Zustand store for symbol, timeframe, candles, loading, and error (replay fields come later).

## Scope (do)

- Client helper to call `/api/klines` and paginate (≤1000 per page) for a reasonable default window
- `SymbolSelect` and `TimeframeSelect` wired to store
- On symbol/timeframe change: refetch and `setData` on the chart
- Zustand store: `symbol`, `timeframe`, `candles`, `status`, `error`
- Replace mock-only chart path with live data (keep mock module for tests/fallback if useful)

## Out of scope (do not)

- Replay engine, play/pause, speed, jump
- Prefetch-for-replay buffers

## Files to create/modify

| File | Action |
|------|--------|
| `store/replayStore.js` | Create — early store (name kept for continuity with later sessions) |
| `lib/binance.js` | Add client `fetchCandles` / pagination |
| `components/SymbolSelect.js` | Create |
| `components/TimeframeSelect.js` | Create |
| `components/AppShell.js` | Wire selectors + loading/error |
| `components/CandleChart.js` | React to `candles` from store/props |

## Exit criteria

- [ ] Default BTCUSDT + a timeframe shows real candles
- [ ] Changing timeframe reloads the chart
- [ ] Loading and error states visible
- [ ] `PROGRESS.md` → `implemented` for session 04

## Tricky bits

- Serialize pagination; handle 429 with a visible error.
- All comparisons in UTC; label that in UI later if needed.
- Hard reset of data on timeframe change (no candle remapping).
