# Implementation Progress

Single source of truth for session status. Agents must read this before starting work when the user asks to **implement next session**.

**Last updated:** 2026-07-19

## Current pointer

- **Last done session:** `04`
- **Next session to implement:** `05` _(awaiting merge)_
- **Active branch:** `session/05-replay-engine`

## Sessions

| ID | Title | Phase | Branch | Status | Merged to main | Notes |
|----|-------|-------|--------|--------|----------------|-------|
| 01 | Project setup | 1 | `session/01-project-setup` | `done` | yes | Next.js App Router + Tailwind shell |
| 02 | Static chart shell | 1 | `session/02-static-chart` | `done` | yes | Mock candles via lightweight-charts v4 |
| 03 | Binance klines proxy | 2 | `session/03-binance-proxy` | `done` | yes | Allowlisted `/api/klines` + cache headers |
| 04 | Real data on chart | 2 | `session/04-real-chart-data` | `done` | yes | Live BTCUSDT via store + selectors |
| 05 | Replay engine module | 3 | `session/05-replay-engine` | `implemented` | no | Pure `createReplayEngine` + `findIndexAtOrBefore` |
| 06 | Store, clock, chart sync | 3 | `session/06-replay-store-sync` | `pending` | no | |
| 07 | Replay controls + prefetch | 3 | `session/07-replay-controls` | `pending` | no | |
| 08 | Polish, tests, edge cases | 4 | `session/08-polish` | `pending` | no | |

## Status legend

- `pending` — not started
- `in_progress` — implementation underway on the session branch
- `implemented` — finished and committed on the session branch; waiting for user OK to merge locally
- `done` — merged into local `main` (user pushes remote themselves)

## Changelog

| Date | Session | Event |
|------|---------|-------|
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
