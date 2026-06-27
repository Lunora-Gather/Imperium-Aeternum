# Release Sprint Audit

This document records the final release sprint audit before `v1.0.0-preview`.

## Scope

Release sprint focuses on hardening, QA, and release readiness. It should not introduce large systems before the public preview tag.

## Current release line

```text
Branch: main
Build marker: 1.0.0-public-preview
Package version: 1.0.0-preview
Suggested tag: v1.0.0-preview
```

## Checks performed

### Repository release state

Verified from repository files:

- `package.json` contains `version: 1.0.0-preview`.
- `package.json` exposes `npm run rc:check`.
- `.github/workflows/deploy-pages.yml` builds and deploys `main` to GitHub Pages.
- Release documents exist for status, QA, tagging, and release notes.

### Dashboard architecture spot-check

Reviewed:

- `src/components/DashboardStrategicHq.tsx`
- `src/gameplay/dashboardCommandGroups.ts`
- `src/gameplay/__tests__/dashboardCommandGroups.test.ts`

Finding:

- `DashboardGovernorAdvisor` was grouped under the onboarding/guide section even though it is an internal-affairs route planner.
- The domestic/economy command group only rendered `EconomyAdvisor`, making the Governor route less discoverable as an internal affairs tool.

Fix applied:

- Moved `governor` from the guide group into the domestic group.
- Updated dashboard command-group tests to assert the intended placement.

## Non-code findings

- Release marker remains `1.0.0-public-preview`; it should not be changed during final QA.
- Release Gate workflow creation was not performed in this environment because workflow creation was blocked by safety checks; the existing `npm run rc:check` remains the authoritative gate.
- Push-triggered workflow visibility may not be available through the connector. Pages and Actions still need manual verification in GitHub UI.

## Final QA commands

```bash
npm ci
VITE_BASE=/Imperium-Aeternum/ npm run rc:check
```

## Manual QA documents

- `docs/FINAL_QA.md`
- `docs/public-preview-qa.md`
- `docs/release-checklist.md`
- `docs/TAGGING_CHECKLIST.md`

## Remaining release blockers

Do not create `v1.0.0-preview` until:

1. `npm run rc:check` passes.
2. GitHub Pages opens successfully.
3. The deployed page shows `1.0.0-public-preview`.
4. Manual QA passes the Dashboard, turn advancement, save/load, diplomacy, economy, and war preview smoke tests.
