# Easy Candle

Replay historical crypto candles on a chart — pick a UTC start time, play through the series, jump around, and switch timeframes without losing the playhead.

Built with Next.js (App Router), `lightweight-charts`, Zustand, and Binance REST via a local proxy.

## Setup

```bash
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
yarn test    # unit tests (replay engine)
yarn build   # production build
```

## How to use

1. Choose symbol and timeframe (live chart loads recent history).
2. Enter a **UTC** start date/time and click **Start replay**.
3. Use Play / Pause / Step / Speed, or **Jump UTC** to seek.
4. Changing timeframe mid-replay keeps the playhead (at-or-before on the new series). Changing symbol exits replay and reloads live data.

All times in the UI are **UTC**. Candle `time` values are Unix seconds (lightweight-charts convention). Binance kline open times arrive in milliseconds and are converted in the proxy.

## Session workflow

This repo is built in focused sessions. See [`docs/SESSIONS.md`](./docs/SESSIONS.md) for the workflow and [`docs/PROGRESS.md`](./docs/PROGRESS.md) for status.

Say **implement next session** to continue, or **merge to main** when a session is ready.

## Architecture notes (v1)

| Piece | Role |
|-------|------|
| `app/api/klines` | Allowlisted Binance proxy; historical ranges cache harder |
| `lib/replayEngine.js` | Pure playhead state machine (no React/timers) |
| `store/replayStore.js` | Clock, prefetch, jump/start window loading |
| `lib/indicators.js` | Stub only — no real indicators in v1 |

### Edge cases (session 07+)

| Case | Behavior |
|------|----------|
| Start / jump in the future | Rejected with a UTC message |
| Start before first candle in the window | Clamped to buffer start + notice |
| Jump outside loaded buffer | Pause → fetch new window → seek |
| Symbol change mid-replay | Hard reset to live mode |
| Timeframe change mid-replay | Reload window; keep playhead time |
| Tab hidden while playing | Replay pauses automatically |
| Prefetch near live edge | Skipped (nothing further to fetch) |

## License

MIT
