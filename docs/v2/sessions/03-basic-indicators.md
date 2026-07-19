# Session v2-03 — Basic indicators (SMA / EMA)

**Phase:** 2  
**Branch:** `session/v2-03-basic-indicators`  
**Depends on:** v2-02 `done`

## Goal

SMA(20) and EMA(20) as line overlays with toolbar toggles.

## Scope (do)

- Implement compute in `lib/indicators.js`; `buildOverlays(candles, activeIds)`
- Render overlays in `CandleChart` via `addLineSeries`
- Store `activeIndicators`; toggle UI (icons)
- Unit tests for SMA/EMA helpers
- Do not put indicator state in `replayEngine.js`

## Out of scope

- RSI/MACD/other indicators, drawings, trading
