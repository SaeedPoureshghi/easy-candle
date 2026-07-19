# Session 02 — Static chart shell

**Phase:** 1  
**Branch:** `session/02-static-chart`  
**Depends on:** Session 01 `done`

## Goal

Render a candlestick chart from hardcoded mock data using `lightweight-charts`, with a minimal app shell and config stubs for symbols/timeframes/indicators.

## Scope (do)

- Client `CandleChart` component (DOM/`window` safe; dynamic import `ssr: false` if needed)
- Mock OHLC data module
- `AppShell` layout: header + control row placeholders + chart area
- Config stubs: `lib/symbols.js`, `lib/timeframes.js`, `lib/indicators.js` (JSDoc contract only)
- Chart accepts candles as `{ time, open, high, low, close }` with `time` in UTC seconds

## Out of scope (do not)

- Binance / `/api/klines`
- Working selectors (can render disabled UI)
- Replay engine or controls

## Files to create/modify

| File | Action |
|------|--------|
| `components/CandleChart.js` | Create — `createChart`, candlestick series, resize, cleanup |
| `components/AppShell.js` | Create — shell layout |
| `lib/mockCandles.js` | Create — static candles |
| `lib/symbols.js` | Create — BTCUSDT entry |
| `lib/timeframes.js` | Create — 1m…1d map |
| `lib/indicators.js` | Create — stub + JSDoc only |
| `app/page.js` | Wire `AppShell` + dynamic chart |

## Exit criteria

- [ ] Static candles visible on the chart
- [ ] No SSR crash from `lightweight-charts`
- [ ] Indicator module exists but implements nothing
- [ ] `PROGRESS.md` → `implemented` for session 02

## Tricky bits

- Match the installed `lightweight-charts` major API (v4 vs v5 series creation).
- Normalize time to **seconds** for the chart library from day one.
