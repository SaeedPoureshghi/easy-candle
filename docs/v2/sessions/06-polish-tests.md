# Session v2-06 — Polish & tests

**Phase:** 4  
**Branch:** `session/v2-06-polish-tests`  
**Depends on:** v2-05 `done`

## Goal

Harden v2 edge cases, tests, and README; mark v2 complete.

## Scope (do)

- Ended replay disables trade/draw; hotkeys vs jump form; overlay sync after jump/TF
- Tests for indicators + paper-trade helpers
- README + docs polish; `package.json` version `2.0.0`

## Exit criteria

- [x] TF change clears drawings + paper trades; markers filtered to series times
- [x] Esc cancels pending draw tool; Space ignored in form fields
- [x] `yarn test` green; README documents v2; version `2.0.0`
