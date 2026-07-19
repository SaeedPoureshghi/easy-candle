# Implementation Progress

Single source of truth for session status. Agents must read this before starting work when the user asks to **implement next session**.

**Last updated:** 2026-07-19

## Current pointer

- **Active version:** v2
- **Last done session:** `v2-03`
- **Next session to implement:** `v2-04`
- **Active branch:** _(none)_

## v1 sessions (complete)

| ID | Title | Phase | Branch | Status | Merged to main | Notes |
|----|-------|-------|--------|--------|----------------|-------|
| 01 | Project setup | 1 | `session/01-project-setup` | `done` | yes | Next.js App Router + Tailwind shell |
| 02 | Static chart shell | 1 | `session/02-static-chart` | `done` | yes | Mock candles via lightweight-charts v4 |
| 03 | Binance klines proxy | 2 | `session/03-binance-proxy` | `done` | yes | Allowlisted `/api/klines` + cache headers |
| 04 | Real data on chart | 2 | `session/04-real-chart-data` | `done` | yes | Live BTCUSDT via store + selectors |
| 05 | Replay engine module | 3 | `session/05-replay-engine` | `done` | yes | Pure `createReplayEngine` + `findIndexAtOrBefore` |
| 06 | Store, clock, chart sync | 3 | `session/06-replay-store-sync` | `done` | yes | Engine in store + clock + setData/update sync |
| 07 | Replay controls + prefetch | 3 | `session/07-replay-controls` | `done` | yes | Start/jump UTC, controls, batch prefetch, TF remap |
| 08 | Polish, tests, edge cases | 4 | `session/08-polish` | `done` | yes | Vitest engine tests, UX polish, README |

## v2 sessions

See [`docs/v2/SESSIONS.md`](./v2/SESSIONS.md).

| ID | Title | Phase | Branch | Status | Merged to main | Notes |
|----|-------|-------|--------|--------|----------------|-------|
| v2-01 | Icon toolbar + UI polish | 1 | `session/v2-01-ui-icons-toolbar` | `done` | yes | lucide icons + docs/v2 scaffold |
| v2-02 | Spacebar shortcut | 1 | `session/v2-02-spacebar-shortcut` | `done` | yes | Space pause / step |
| v2-03 | Basic indicators (SMA / EMA) | 2 | `session/v2-03-basic-indicators` | `done` | yes | SMA20 / EMA20 overlays |
| v2-04 | Basic drawings | 2 | `session/v2-04-basic-drawings` | `pending` | no | |
| v2-05 | Simple paper trading | 3 | `session/v2-05-simple-paper-trading` | `pending` | no | |
| v2-06 | Polish & tests | 4 | `session/v2-06-polish-tests` | `pending` | no | |

## Status legend

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Implementation underway on the session branch |
| `implemented` | Finished and committed on the session branch; waiting for user OK to merge locally |
| `done` | Merged into local `main` |

## Changelog

| Date | Session | Event |
|------|---------|-------|
| 2026-07-19 | v2-03 | Merged into local `main`; status → `done`. |
| 2026-07-19 | v2-03 | SMA/EMA overlays + toggles + tests; status → `implemented`. |
| 2026-07-19 | v2-02 | Merged into local `main`; status → `done`. |
| 2026-07-19 | v2-02 | Spacebar pause / step-forward hotkey; status → `implemented`. |
| 2026-07-19 | v2-01 | Merged into local `main`; status → `done`. |
| 2026-07-19 | v2-01 | Icon toolbar + docs/v2 scaffold; status → `implemented`. |
| 2026-07-19 | v2-01 | Started icon toolbar + docs/v2 scaffold; status → `in_progress`. |
| 2026-07-19 | 08 | Merged `session/08-polish` into local `main`; status → `done`. v1 complete. |
| 2026-07-19 | 08 | Vitest engine tests, empty/error/ended UX, tab-hidden pause, README; status → `implemented`. |
| 2026-07-19 | 07 | Merged `session/07-replay-controls` into local `main`; status → `done`. |
| 2026-07-19 | 07 | Replay start/jump UTC controls + forward prefetch; status → `implemented`. |
| 2026-07-19 | 06 | Merged `session/06-replay-store-sync` into local `main`; status → `done`. |
| 2026-07-19 | 06 | Store clock + chart setData/update sync; status → `implemented`. |
| 2026-07-19 | 05 | Merged `session/05-replay-engine` into local `main`; status → `done`. |
| 2026-07-19 | 05 | Pure replay engine + candle seek helper; status → `implemented`. |
| 2026-07-19 | 04 | Merged `session/04-real-chart-data` into local `main`; status → `done`. |
| 2026-07-19 | 04 | Live chart data + selectors + Zustand store; status → `implemented`. |
| 2026-07-19 | 03 | Merged `session/03-binance-proxy` into local `main`; status → `done`. |
| 2026-07-19 | 03 | Binance klines proxy route + helpers; status → `implemented`. |
| 2026-07-19 | 02 | Merged `session/02-static-chart` into local `main`; status → `done`. |
| 2026-07-19 | 02 | Static chart shell with mock OHLC + AppShell; status → `implemented`. |
| 2026-07-19 | 01 | Merged `session/01-project-setup` into local `main`; status → `done`. |
| 2026-07-19 | 01 | Scaffolded Next.js App Router + Tailwind; status → `implemented`. |
| 2026-07-19 | — | Progress file created; all sessions `pending`. Repo init on `main` (`yarn`, GitHub). |
