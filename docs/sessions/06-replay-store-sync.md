# Session 06 — Store, clock, chart sync

**Phase:** 3  
**Branch:** `session/06-replay-store-sync`  
**Depends on:** Session 05 `done`

## Goal

Own a replay engine instance in Zustand, run the play clock outside the engine, and keep `CandleChart` in sync efficiently (`setData` vs `update`).

## Scope (do)

- Extend `store/replayStore.js`: engine instance, replay status, speed, enter/exit replay helpers
- Timer/clock: call `stepForward()` every `baseMs / speed`; clear on pause/unmount
- Chart sync rules:
  - Enter replay / seek / step back / symbol·timeframe reset → `series.setData(visible)`
  - Sequential step forward / play tick → `series.update(candle)` when possible
- Enter replay from a start index/time using already-loaded candles (full jump UI + prefetch in session 07)
- Pause and reset replay when symbol or timeframe changes

## Out of scope (do not)

- Full ReplayControls UI (play/pause/step/speed/jump components) — session 07
- Background prefetch of forward batches — session 07 (can stub `needsPrefetch` hook)

## Files to create/modify

| File | Action |
|------|--------|
| `store/replayStore.js` | Engine + clock + actions |
| `components/CandleChart.js` | Imperative-friendly updates (`reset` / `append`) |
| `components/AppShell.js` | Minimal way to enter replay for manual testing (e.g. button using a fixed start) |

## Exit criteria

- [ ] Can enter a replay state and advance candles on a timer
- [ ] Pause stops the clock
- [ ] Chart does not recreate on every tick
- [ ] Symbol/timeframe change resets replay
- [ ] `PROGRESS.md` → `implemented` for session 06

## Tricky bits

- Do not recreate `createChart` on each candle — update the series only.
- Keep engine pure; timer lives in the store or a tiny hook used by the store.
