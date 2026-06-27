# Final QA Checklist

This checklist is the final verification path for the 1.0 public preview.

## Automated gate

Run the release-candidate gate locally or in CI:

```bash
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

The gate currently includes:

- TypeScript typecheck
- data validation
- stability tests
- targeted advisor, dashboard, economy, diplomacy, war, and AI tests
- Pages-compatible build

## Manual browser smoke

Use the deployed Pages build or a local preview build.

1. Open the game.
2. Confirm the footer/build marker shows `1.0.0-public-preview`.
3. Start the classic scenario.
4. Confirm Dashboard opens without a blank page.
5. Expand/collapse each command group.
6. Click the Governor Advisor primary action and confirm it changes page or stays safely disabled.
7. Advance one year.
8. Confirm the annual report appears.
9. Return to Dashboard.
10. Save to slot 1.
11. Reload and load slot 1.
12. Open Economy, Diplomacy, Military, Stats, Chronicle, and Save pages.
13. Confirm there are no uncaught errors or broken panels.

## Release blockers

Do not tag 1.0 if any of these are true:

- `rc:check` fails
- Pages build fails
- A fresh game cannot advance one year
- Save/load roundtrip fails
- Dashboard fails to render
- README or release notes still show an old build marker
- `main` is not the canonical branch for the release candidate

## Allowed fixes during final QA

- Test fixes
- Type fixes
- Workflow fixes
- Documentation corrections
- Small UI copy fixes
- Save/load compatibility fixes
- Balance tuning with explicit notes

## Not allowed during final QA

- New major systems
- Save schema change without migration
- Large UI rewrites
- New automation that mutates the player state
- New long-lived integration branches

## Release confirmation

Before publishing or refreshing a release:

1. Confirm `BUILD_MARK` is `1.0.0-public-preview`.
2. Confirm package version is `1.0.0-preview`.
3. Confirm `docs/release-notes-v1.0.0-preview.md` matches the current build.
4. Confirm README links are correct.
5. Confirm Pages deploy is visible.
6. Confirm the GitHub Release points at `main` and tag `v1.0.0-preview`.
