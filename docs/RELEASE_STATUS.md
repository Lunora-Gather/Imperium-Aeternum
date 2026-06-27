# 1.0 Public Preview Release Status

This is the final status record for the 1.0 public preview candidate.

## Current state

```text
Branch: main
Build marker: 1.0.0-public-preview
Package version: 1.0.0-preview
Suggested tag: v1.0.0-preview
Stage: Final QA / Tag Ready
```

## Completed release work

- Clean RC integration was merged into `main`.
- Oversized legacy preview PR path was closed.
- Dashboard command grouping is integrated.
- Governor Advisor is integrated as an advisory route planner.
- Release Readiness center is integrated.
- Stability tests cover turn processing, persistence roundtrip, and Dashboard smoke.
- Unified release gate exists as `npm run rc:check`.
- Pages workflow builds `main` and runs the unified gate.
- README is updated for public preview.
- Release Notes are prepared.
- GitHub Release draft is prepared.
- Final QA and Tagging checklists are prepared.

## Remaining hard gate

Do not publish the GitHub Release or create the final tag until both are true:

1. `VITE_BASE=/Imperium-Aeternum/ npm run rc:check` passes.
2. The GitHub Pages deployment is visible and shows `1.0.0-public-preview`.

## Why no more feature work before tag

The project has reached the release-candidate boundary. Further large feature work would increase release risk and should be moved to the post-1.0 backlog.

## Known tooling limitation

The GitHub connector available during this work does not reliably surface push-triggered Pages workflow runs, so deployment success must be confirmed from GitHub Actions or by opening the Pages site.
