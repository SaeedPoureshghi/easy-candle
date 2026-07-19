# Easy Candle — Session Workflow

This project is built in **sessions**. Each session is one focused slice of work from the implementation plan. Sessions are implemented on a **feature branch**, reviewed by you, then merged to `main` only when you ask.

## How work proceeds

1. You say **implement next session** (or name a session explicitly).
2. The agent reads [`PROGRESS.md`](./PROGRESS.md) to find the last session with status `done`.
3. The agent implements the **next** `pending` session only.
4. Before coding, the agent creates and checks out a branch named after that session (see below).
5. When the session work is finished, the agent updates `PROGRESS.md` for that session to `implemented` (awaiting your merge approval).
6. You review. If you are OK, you ask to **merge to main** (or create a PR / merge yourself).
7. After merge to `main`, that session is marked `done` in `PROGRESS.md`.

## Branch naming

```
session/<NN>-<short-slug>
```

Examples:

- `session/01-project-setup`
- `session/02-static-chart`

Always branch from an up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b session/0N-short-slug
```

## Merge policy

- Do **not** merge to `main` unless you explicitly ask.
- Prefer a PR (`gh pr create`) when you ask to merge, unless you say to merge locally.
- One session = one branch = one merge unit.

## Session index

| ID | Phase | Title | Doc |
|----|-------|-------|-----|
| 01 | 1 | Project setup | [sessions/01-project-setup.md](./sessions/01-project-setup.md) |
| 02 | 1 | Static chart shell | [sessions/02-static-chart.md](./sessions/02-static-chart.md) |
| 03 | 2 | Binance klines proxy | [sessions/03-binance-proxy.md](./sessions/03-binance-proxy.md) |
| 04 | 2 | Real data on chart | [sessions/04-real-chart-data.md](./sessions/04-real-chart-data.md) |
| 05 | 3 | Replay engine module | [sessions/05-replay-engine.md](./sessions/05-replay-engine.md) |
| 06 | 3 | Store, clock, chart sync | [sessions/06-replay-store-sync.md](./sessions/06-replay-store-sync.md) |
| 07 | 3 | Replay controls + prefetch | [sessions/07-replay-controls.md](./sessions/07-replay-controls.md) |
| 08 | 4 | Polish, tests, edge cases | [sessions/08-polish.md](./sessions/08-polish.md) |

## Status meanings (`PROGRESS.md`)

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Currently being implemented on a session branch |
| `implemented` | Code finished on the session branch; waiting for your OK to merge |
| `done` | Merged to `main` |

## Agent rules for this repo

When the user says **implement next session**:

1. Open [`PROGRESS.md`](./PROGRESS.md).
2. Find the highest session ID with status `done` (or none → start at 01).
3. If a session is `in_progress` or `implemented`, stop and report that; do not start a new session until that one is `done` or the user redirects.
4. Read that session’s markdown under `docs/sessions/`.
5. Create the session branch from `main`, implement only that session’s scope, update progress.

When the user says **merge** (this session / to main):

1. Confirm the current session is `implemented`.
2. Merge or open a PR as requested.
3. Mark the session `done` in `PROGRESS.md` after it lands on `main`.

## Stack reminders (v1)

- Next.js App Router (JavaScript)
- `lightweight-charts` for candlesticks
- Binance REST via `app/api/klines` proxy
- Zustand + pure `lib/replayEngine.js`
- Tailwind CSS
- Indicators stubbed only (`lib/indicators.js`) — no real indicators in v1
