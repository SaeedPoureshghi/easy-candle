# Session v2-02 — Spacebar shortcut

**Phase:** 1  
**Branch:** `session/v2-02-spacebar-shortcut`  
**Depends on:** v2-01 `done`

## Goal

Space toggles pause vs step-forward during replay.

## Scope (do)

- `hooks/useReplayHotkeys.js` (or equivalent in AppShell)
- Playing → `pause()`; paused/ready → `stepForward()`
- Ignore when focus is in input / textarea / select / contenteditable
- StatusBar hint: Space step / pause

## Out of scope

- Other hotkeys, indicators, drawings, trading
