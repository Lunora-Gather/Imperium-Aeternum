# Post-1.0 Backlog

This backlog captures work that should wait until after the 1.0 public preview tag.

## Release-safe priorities

These can be handled shortly after the public preview if needed:

- Confirm GitHub Pages deploy status from Actions.
- Fix any failing release-gate test.
- Update `package-lock.json` top-level package version if a local `npm install --package-lock-only` is run.
- Add screenshots to README.
- Keep `docs/release-notes-v1.0.0-preview.md` aligned with the published GitHub Release.

## Quality and stability

- Add browser-level end-to-end smoke tests.
- Add long-run 20-year and 50-year simulation tests.
- Add save compatibility fixtures for older known saves.
- Add performance checks for large states.
- Add map rendering smoke tests.

## Gameplay polish

- Tune early-game economy pacing.
- Tune war readiness and win chance formulas after manual playtesting.
- Add more event chains.
- Add more AI personality differences.
- Improve diplomatic relationship visibility.
- Improve the annual report explanation layer.

## Governor Advisor future work

Keep this after 1.0 because it can change player-state safety expectations:

- Add action preview diffs.
- Add confirm-only low-risk execution.
- Add undo/save prompt before any automated state mutation.
- Keep high-risk military and diplomatic actions advisory-only until tested.

## Documentation

- Add screenshots.
- Add a short player guide.
- Add known-issues section to the GitHub Release.
- Add contributor notes if the repository becomes collaborative.

## Rule

No item in this backlog should block `v1.0.0-preview` unless it directly breaks the release gate, Pages deployment, save/load, or Dashboard rendering.
