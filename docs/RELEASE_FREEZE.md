# Imperium Aeternum Release Freeze

This document defines the V52 release-freeze rules for turning the current release candidate into a stable public preview.

## Current target

```text
Current build marker: V52 release-freeze
Release target: 1.0 public preview
Primary branch: main
Deployment target: GitHub Pages
```

The project is no longer in feature expansion mode. V52 and later release-candidate work should focus on stability, clarity, deployment, and documentation.

## Freeze rules

Allowed changes:

- Bug fixes
- Type fixes
- Save/load compatibility fixes
- Test coverage improvements
- Dashboard clarity improvements
- Deployment workflow fixes
- README and release-note updates
- Balance tuning backed by tests or manual verification

Avoid until after 1.0:

- New large gameplay systems
- Save schema changes without migration
- Broad UI rewrites
- Unreviewed AI automation that mutates game state
- Large branch histories that bypass the release candidate path

## Release gates

A build can be considered release-ready only when all gates below are satisfied.

### Code and build

- `npm run typecheck` passes
- `npm run validate` passes
- targeted Vitest suites pass
- `npm run pages:build` passes with `VITE_BASE=/Imperium-Aeternum/`
- Pages artifact deploys successfully

### Stability

- Fresh game can advance multiple years without throwing
- `lastReport` and rolling `history` update correctly
- Save/load roundtrip works from at least one manual slot
- Corrupt save slot fails safely
- Legacy save migration normalizes missing arrays and invalid player id
- Dashboard advisor stack builds after several processed turns

### Product readiness

- README explains the game, online demo, local run commands, and current release state
- Release Readiness panel displays the current build marker
- Dashboard first group includes release and governor guidance
- The old oversized preview PR path is closed or explicitly superseded
- `main` is the canonical release-candidate branch

## Manual smoke checklist

Before tagging 1.0, manually verify:

1. Open the Pages build.
2. Confirm footer/build marker shows the expected version.
3. Start a classic scenario.
4. Open Dashboard and confirm the command groups render.
5. Advance one year.
6. Confirm the annual report appears.
7. Save to a slot.
8. Reload the page and load the slot.
9. Open Economy, Diplomacy, Military, and Save pages.
10. Confirm no blank page or uncaught error appears.

## Current known limitations

- Automated GitHub connector checks may not always surface push-triggered Pages runs.
- Governor Advisor is advisory only; it does not execute actions automatically.
- Full end-to-end browser testing is not yet added.
- Long-game balance still needs manual multi-decade playtesting.

## Next recommended milestones

- V53: release bugfix sweep and workflow verification
- V54: README screenshots and public-facing release notes
- V55: 1.0 tag preparation
- V56: post-release balance backlog
