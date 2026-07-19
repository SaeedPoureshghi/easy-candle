# Session 08 — Polish, tests, edge cases

**Phase:** 4  
**Branch:** `session/08-polish`  
**Depends on:** Session 07 `done`

## Goal

Harden v1: engine unit tests, clearer empty/error/loading UX, documented runbook, and indicator-ready structure confirmed without implementing indicators.

## Scope (do)

- Unit tests for `lib/replayEngine.js` (step, seek, bounds, load/reset, append without index reset)
- Empty / error / loading / ended UI polish
- Optional: pause replay clock when tab is hidden
- Tighten API cache/error messaging if gaps remain
- Root `README.md`: how to run, session workflow pointer, Binance/UTC notes
- Confirm `lib/indicators.js` contract still matches candle shape; chart ready for future `overlays` prop (no real indicators)

## Out of scope (do not)

- New features (WebSocket live mode, drawings, more symbols beyond easy config)
- Real SMA/RSI/etc. implementations

## Files to create/modify

| File | Action |
|------|--------|
| `lib/replayEngine.test.js` | Create (Vitest or Jest — pick one and add to `package.json`) |
| `components/CandleChart.js` / `StatusBar.js` | Empty/loading polish |
| `app/api/klines/route.js` | Final cache/error pass if needed |
| `README.md` | Create/update |
| `lib/indicators.js` | Confirm stub contract |

## Exit criteria

- [ ] Engine tests pass via yarn script
- [ ] README explains setup + links to `docs/SESSIONS.md`
- [ ] Known edge cases from session 07 handled or explicitly noted
- [ ] `PROGRESS.md` → `implemented` for session 08 (then `done` after merge → v1 complete)

## Tricky bits

- If long replays make `setData` heavy, consider capping visible history (last N candles) only if profiling shows a need.
- Do not put indicator state into `replayEngine.js`.
