# Session 03 — Binance klines proxy

**Phase:** 2  
**Branch:** `session/03-binance-proxy`  
**Depends on:** Session 02 `done`

## Goal

Add a Next.js Route Handler that proxies Binance klines, validates inputs against allowlists, normalizes candle rows, and caches historical responses aggressively.

## Scope (do)

- `GET /api/klines` with query: `symbol`, `interval`, `startTime`, `endTime`, `limit` (max 1000)
- Validate against `lib/symbols.js` and `lib/timeframes.js`
- Fetch Binance `GET /api/v3/klines` server-side
- Map rows → `{ candles: [{ time, open, high, low, close, volume? }] }` (`time` in seconds for chart use, or document ms→seconds at the boundary)
- Caching for past ranges (`revalidate` / `Cache-Control`)
- Shared helpers in `lib/binance.js` / `lib/candleUtils.js` usable by the route and later by the client

## Out of scope (do not)

- Wiring selectors in the UI
- Pagination loops in the browser (can add server helper; client orchestration is session 04)
- Replay

## Files to create/modify

| File | Action |
|------|--------|
| `app/api/klines/route.js` | Create — proxy + cache + errors |
| `lib/binance.js` | Create — URL build, fetch, normalize |
| `lib/candleUtils.js` | Create — mapping, dedupe helpers |
| `lib/symbols.js` / `lib/timeframes.js` | Export allowlists usable by the route |

## Exit criteria

- [ ] Hitting `/api/klines?symbol=BTCUSDT&interval=1h&limit=100` returns normalized JSON
- [ ] Invalid symbol/interval → 400
- [ ] Upstream failure → clear 502/error body
- [ ] `PROGRESS.md` → `implemented` for session 03

## Tricky bits

- Binance limit max **1000**; enforce server-side.
- Rate limits: keep handler simple; no burst loops inside a single request unless carefully capped.
- Do not expose arbitrary proxied URLs — allowlist only.
