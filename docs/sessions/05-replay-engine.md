# Session 05 — Replay engine module

**Phase:** 3  
**Branch:** `session/05-replay-engine`  
**Depends on:** Session 04 `done`

## Goal

Implement a pure, UI-agnostic replay state machine in `lib/replayEngine.js` that can be unit-tested without React or the DOM. No UI wiring required in this session beyond optional smoke usage.

## Scope (do)

- Engine state: `candles`, `index`, `isPlaying`, `speed`, `status` (`idle | ready | playing | paused | ended`)
- Methods: `load`, `play`, `pause`, `stepForward`, `stepBackward`, `setSpeed`, `seekToTime` / `seekToIndex`, `getVisibleCandles`, `getCurrentCandle`, `needsPrefetch`, optional `appendCandles`
- **No** `setInterval` / rAF inside the engine — clock stays outside
- Speeds: `0.5`, `1`, `2`, `4`
- Export a clean factory or class; keep candle shape compatible with the chart

## Out of scope (do not)

- Zustand timer integration (session 06)
- Replay control components (session 07)
- Changing `CandleChart` append/`update` behavior (session 06)

## Files to create/modify

| File | Action |
|------|--------|
| `lib/replayEngine.js` | Create — full engine |
| `lib/candleUtils.js` | Add `findIndexAtOrBefore` if not already present |
| Optional: minimal node/script smoke test | Only if useful; formal tests in session 08 |

## Exit criteria

- [ ] Engine can load candles, step ±, seek, and report visible slice
- [ ] Bounds: cannot step before 0; stepping past end → `ended`
- [ ] No React imports in `lib/replayEngine.js`
- [ ] `PROGRESS.md` → `implemented` for session 05

## Tricky bits

- `seekToTime` should use “at or before” semantics for the start candle.
- `appendCandles` (if added) must not reset `index` when only extending forward.
