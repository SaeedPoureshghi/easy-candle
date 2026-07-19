# Session 01 — Project setup

**Phase:** 1  
**Branch:** `session/01-project-setup`  
**Depends on:** nothing (first session)

## Goal

Turn the yarn-initialized repo into a runnable Next.js App Router app with Tailwind, core dependencies installed, and a minimal home page.

## Scope (do)

- Scaffold Next.js (App Router, JavaScript) on top of existing `package.json` / yarn
- Add Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, `app/globals.css`)
- Install deps: `next`, `react`, `react-dom`, `lightweight-charts`, `zustand`
- Create `next.config.mjs`, `app/layout.js`, `app/page.js` with a simple “Easy Candle” shell message
- Ensure `yarn dev` starts without errors

## Out of scope (do not)

- Chart component / lightweight-charts usage
- Binance API
- Replay logic
- Zustand store wiring

## Files to create/modify

| File | Action |
|------|--------|
| `package.json` | Add scripts (`dev`, `build`, `start`) and dependencies |
| `next.config.mjs` | Create |
| `tailwind.config.js` | Create |
| `postcss.config.js` | Create |
| `app/globals.css` | Create (Tailwind directives) |
| `app/layout.js` | Create |
| `app/page.js` | Create (placeholder UI) |
| `.gitignore` | Ensure Next.js defaults (`.next`, `node_modules`, etc.) |

## Exit criteria

- [ ] `yarn dev` serves a page at localhost
- [ ] Tailwind classes apply on the placeholder page
- [ ] `PROGRESS.md` updated to `implemented` for session 01

## Notes

Pin a specific `lightweight-charts` major version now even if unused until session 02, so later sessions do not thrash the lockfile.
