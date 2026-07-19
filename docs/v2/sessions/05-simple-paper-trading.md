# Session v2-05 — Simple paper trading

**Phase:** 3  
**Branch:** `session/v2-05-simple-paper-trading`  
**Depends on:** v2-04 `done`

## Goal

Replay-only Buy/Sell simulation at current close with markers and unrealized PnL.

## Rules

- One open position at a time
- Buy / Sell: open long/short when flat (at current close); must Close before opening again
- Close: realize PnL into session history (no flip)
- Cumulative session PnL = sum of closed + unrealized on open
- Trade dock below chart lists each position; in-memory only (exit / refresh clears)
- No size, fees, TP/SL, or persistence

## Out of scope

- Position size, TP/SL, multi-leg history

## Exit criteria

- [x] Replay-only Buy / Sell at current close
- [x] Chart markers + unrealized PnL HUD
- [x] Reset on exit replay
- [x] Unit tests for paper-trade helpers
