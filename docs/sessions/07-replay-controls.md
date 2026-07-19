# Session 07 — Replay controls + prefetch

**Phase:** 3  
**Branch:** `session/07-replay-controls`  
**Depends on:** Session 06 `done`

## Goal

Ship the full replay UX: start picker, play/pause, step ±, speed, jump-to-time, and batched forward prefetch so play does not call Binance one candle at a time.

## Scope (do)

- `ReplayStartPicker` — UTC start date/time → load lookback + forward buffer → engine `load` at start index
- `ReplayControls` — Play, Pause, Step Forward, Step Backward, Speed (0.5x/1x/2x/4x)
- Jump to date/time: fetch window if needed, then `seekToTime`
- Prefetch: when `needsPrefetch`, fetch next batch, `appendCandles`, do not reset index
- Disable controls appropriately (e.g. step back at index 0; ended state)
- Status text: current candle time / loading / prefetch / ended (can be inline or `StatusBar`)

## Out of scope (do not)

- Unit test suite (session 08)
- Indicators
- Multi-symbol beyond config readiness

## Files to create/modify

| File | Action |
|------|--------|
| `components/ReplayStartPicker.js` | Create |
| `components/ReplayControls.js` | Create |
| `components/StatusBar.js` | Create (optional but recommended) |
| `components/AppShell.js` | Compose controls |
| `lib/binance.js` | `fetchCandlesRange` / `prefetchForward` |
| `store/replayStore.js` | Jump + prefetch actions |

## Exit criteria

- [ ] Full control set works for BTCUSDT on all listed timeframes
- [ ] Play consumes local buffer; network only for batch prefetch/jump
- [ ] Jump and start picker labeled/handled as UTC
- [ ] `PROGRESS.md` → `implemented` for session 07

## Tricky bits

| Event | Behavior |
|-------|----------|
| Timeframe / symbol change mid-replay | Hard reset; user picks start again |
| Jump outside buffer | Pause → fetch → seek |
| Start before first candle | Clamp + message |
| Start in the future | Reject |
