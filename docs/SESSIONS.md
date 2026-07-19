# Easy Candle — Session Workflow

This project is built in **sessions**. Each session is one focused slice of work from the implementation plan. Sessions are implemented on a **feature branch**, reviewed by you, then merged to `main` locally only when you ask. You push `main` to the remote yourself.

## How work proceeds

1. You say **implement next session** (or name a session explicitly).
2. The agent reads [`PROGRESS.md`](./PROGRESS.md) to find the last session with status `done`.
3. The agent implements the **next** `pending` session only.
4. Before coding, the agent creates and checks out a branch named after that session (see below).
5. When the session work is finished, the agent:
   - updates `PROGRESS.md` for that session to `implemented`
   - **commits locally** on the session branch with a short, professional message
6. You review. If you are OK, you ask to **merge to main**.
7. The agent merges the session branch into `main` **locally** (no pull request), marks the session `done` in `PROGRESS.md`, commits that progress update on `main` if needed, then **deletes the local session branch**.
8. You push updated `main` to the remote when you want.

## Branch naming

```
session/<NN>-<short-slug>
```

Examples:

- `session/01-project-setup`
- `session/02-static-chart`

Always branch from local `main`:

```bash
git checkout main
git checkout -b session/0N-short-slug
```

Do not push session branches or `main` unless the user explicitly asks. The user pushes `main` themselves.

## Commit policy

- After each session implementation is complete, **commit locally** on the session branch with a short, proper message (what/why, 1 line preferred).
- Include the `PROGRESS.md` status update (`implemented`) in that commit when practical.
- Do **not** push to remote unless the user explicitly asks.

## Merge policy

- Do **not** merge to `main` unless the user explicitly asks.
- Always merge **locally** (`git checkout main` → `git merge session/...`).
- **No pull requests** — do not use `gh pr create` or open PRs for session merges.
- One session = one branch = one local merge unit.
- After a successful local merge:
  1. Mark the session `done` in `PROGRESS.md` and commit on `main` if that file changed.
  2. Delete the local session branch (`git branch -d session/...`). Only delete after the merge succeeded.
- Leave pushing `main` to the user.

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
| `implemented` | Code finished and committed on the session branch; waiting for your OK to merge locally |
| `done` | Merged into local `main` |

## Agent rules for this repo

When the user says **implement next session**:

1. Open [`PROGRESS.md`](./PROGRESS.md).
2. Find the highest session ID with status `done` (or none → start at 01).
3. If a session is `in_progress` or `implemented`, stop and report that; do not start a new session until that one is `done` or the user redirects.
4. Read that session’s markdown under `docs/sessions/`.
5. Create the session branch from local `main`, implement only that session’s scope.
6. Set progress to `implemented`, commit locally on the session branch with a short proper message. Do not push. Do not merge yet.

When the user says **merge** (this session / to main):

1. Confirm the current session is `implemented`.
2. Merge the session branch into `main` **locally** (no PR).
3. Mark the session `done` in `PROGRESS.md`, commit on `main` if needed.
4. After a successful merge, delete the local session branch (`git branch -d session/...`).
5. Do not push; remind the user they can push `main` themselves.

## Stack reminders (v1)

- Next.js App Router (JavaScript)
- `lightweight-charts` for candlesticks
- Binance REST via `app/api/klines` proxy
- Zustand + pure `lib/replayEngine.js`
- Tailwind CSS
- Indicators stubbed only (`lib/indicators.js`) — no real indicators in v1
