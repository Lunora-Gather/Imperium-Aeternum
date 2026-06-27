# Release Notes Draft — Imperium Aeternum 1.0 Preview

## Headline

Imperium Aeternum is now a release-candidate historical strategy simulation focused on long-term statecraft, not simple expansion.

## Current build

```text
V53 release-gate
```

## Major systems now included

- Scenario selection and playable nation setup
- Annual turn processing with reports and rolling history
- Economy, population, politics, diplomacy, technology, culture, war, and AI turn settlement
- Save/load with multi-slot persistence and migration normalization
- Dashboard command grouping
- Strategic HQ planning
- Governor Advisor route planning
- Turn Risk Center
- Economy Advisor
- Diplomacy Advisor
- War assessment and war opportunity preview
- Onboarding Coach
- Release Readiness center
- Chronicle and annual reporting
- GitHub Pages deployment workflow
- Unified `rc:check` release gate
- Stability test suite for turns, saves, and dashboard advisor smoke checks

## What changed in the release-candidate phase

### V50 Release Candidate

- Replaced the oversized preview branch integration with a clean release-candidate merge into `main`.
- Added Dashboard command groups and collapsible command stack.
- Added Governor Advisor as a safe, advisory route planner.
- Added Release Readiness center.
- Updated Pages workflow to build the current branch/main directly.

### V51 Stability Suite

- Added turn stability tests.
- Added persistence roundtrip tests.
- Added Dashboard advisor smoke tests.
- Added these suites to the Pages deployment gate.

### V52 Release Freeze

- Added release-freeze rules.
- Added release notes draft.
- Updated README to reflect the current release-candidate posture.
- Added data validation to the deployment gate.

### V53 Release Gate

- Consolidated local and CI release checks into `npm run rc:check`.
- Simplified the Pages workflow so it uses the same gate as local release validation.
- Added `docs/FINAL_QA.md` for final manual browser smoke checks.
- Refreshed README and release-freeze docs to reflect the unified gate.

## Stability policy

From V52 until 1.0, the project should avoid large new systems. Work should focus on:

- fixing failing tests
- improving release documentation
- validating Pages deployment
- smoke-testing new games and save/load
- improving balance without changing save schema

## Known limitations before 1.0

- Browser-level automated e2e tests are not yet present.
- Governor Advisor does not execute actions automatically.
- Long-run balance still needs manual multi-decade testing.
- GitHub connector status checks may not show push-triggered Pages runs immediately.

## Suggested 1.0 tag criteria

- `main` shows the final build marker.
- `VITE_BASE=/Imperium-Aeternum/ npm run rc:check` passes.
- Pages deploy is confirmed.
- README and release notes are final.
- Manual smoke checklist in `docs/FINAL_QA.md` is complete.
