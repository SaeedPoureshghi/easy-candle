# Easy Candle

Replay historical crypto candles on a chart — pick a UTC start time, play through the series, jump around, and practice with basic indicators, drawings, and paper trades.

Built with Next.js (App Router), `lightweight-charts`, Zustand, and Binance REST via a local proxy.

**Version:** 2.x (v1 replay core + v2 chart tools)

## Setup

```bash
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
yarn test    # unit tests (engine, indicators, paper trade)
yarn build   # production build
```

## How to use

1. Choose symbol and timeframe (live chart loads recent history).
2. Enter a **UTC** start date/time and start replay.
3. Use Play / Pause / Step / Speed, or Jump UTC to seek.
4. **Space** — pause while playing, otherwise step forward one candle (ignored in form fields).
5. Toggle **SMA 20** / **EMA 20** overlays.
6. In replay: draw **horizontal** or **trend** lines; **Esc** cancels a pending trend / returns to select.
7. Below the chart: **Buy** / **Sell** open a long/short when flat; **Close** realizes PnL. Session list shows each trade + cumulative performance (resets on exit replay / refresh).
8. Changing timeframe mid-replay keeps the playhead, clears drawings, and auto-closes any open trade into session history. Changing symbol exits replay and clears all trades.

All times in the UI are **UTC**. Candle `time` values are Unix seconds (lightweight-charts convention).

## Session workflow

This repo is built in focused sessions. See [`docs/SESSIONS.md`](./docs/SESSIONS.md) and [`docs/PROGRESS.md`](./docs/PROGRESS.md).

- v1 (complete): [`docs/sessions/`](./docs/sessions/)
- v2 (active index): [`docs/v2/SESSIONS.md`](./docs/v2/SESSIONS.md)

## Architecture notes

| Piece | Role |
|-------|------|
| `app/api/klines` | Allowlisted Binance proxy |
| `lib/replayEngine.js` | Pure playhead state machine (no React/timers) |
| `store/replayStore.js` | Clock, prefetch, indicators/drawings/paper-trade UI state |
| `lib/indicators.js` | SMA(20) / EMA(20) → chart line overlays |
| `lib/paperTrade.js` | Simple 1-unit long/short + unrealized PnL |
| `components/DrawingOverlay.js` | SVG hline / trendline layer |

### Edge cases

| Case | Behavior |
|------|----------|
| Start / jump in the future | Rejected with a UTC message |
| Start before first candle in the window | Clamped to buffer start + notice |
| Jump outside loaded buffer | Pause → fetch new window → seek |
| Symbol change mid-replay | Hard reset to live mode |
| Timeframe change mid-replay | Reload window; keep playhead; clear drawings + trades |
| Tab hidden while playing | Replay pauses automatically |
| Replay ended | Trade / draw tools disabled |
| Space in date/time inputs | Ignored (no step/pause) |
| Prefetch near live edge | Skipped |

### Out of scope (later versions)

Position size, TP/SL, advanced indicators, advanced drawings, WebSocket live, TradingView Charting Library.

## License

MIT
