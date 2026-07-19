# Session v2-05 — Simple paper trading

**Phase:** 3  
**Branch:** `session/v2-05-simple-paper-trading`  
**Depends on:** v2-04 `done`

## Goal

Replay-only Buy/Sell simulation at current close with markers and unrealized PnL.

## Rules

- One open position at a time
- Buy: open/flip to long at current close
- Sell: open/flip to short at current close (or close opposite by flipping)
- Unrealized PnL vs current close; markers on chart
- Reset on exit replay
- No size, fees, TP/SL, or history panel

## Out of scope

- Position size, TP/SL, multi-leg history

## Exit criteria

- [x] Replay-only Buy / Sell at current close
- [x] Chart markers + unrealized PnL HUD
- [x] Reset on exit replay
- [x] Unit tests for paper-trade helpers
