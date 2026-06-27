# Release checklist

Use this checklist whenever a new preview or release candidate build is prepared.

## 1. Build source

Current release source branch:

- `main`

Current deployment workflow:

- `Deploy Pages`

Public URL:

- https://lunora-gather.github.io/Imperium-Aeternum/

## 2. Expected GitHub Actions state

Before release, all required checks should be green:

- TypeScript typecheck.
- Full Vitest regression suite.
- Data/scenario validation.
- Pages-compatible production build.
- GitHub Pages deployment.

Only `main` should be treated as the canonical public release line. Old optimization branches may be used for audit only and should not be merged wholesale.

## 3. Dashboard smoke test

Open the public URL and verify the Dashboard loads without a blank page. Then confirm the command stack is visible:

- Target Coach / 目标教练.
- Strategic HQ / 帝国总参.
- Release Readiness / 发布就绪.
- Pre-turn Risk Center / 推进前风险中枢.
- Economy Advisor / 经济内政顾问.
- Governor Advisor / 地方治理顾问.
- Diplomacy Advisor / 外交顾问.
- War Opportunity / 战争机会.

## 4. Gameplay smoke test

Verify the core loop:

- Start or load a game.
- Open Dashboard.
- Follow the Target Coach first action.
- Inspect release readiness, blockers, and warnings.
- Open Economy/Province/Governor advice from an advisor action.
- Open Diplomacy page from an advisor action.
- Open Military page from a war opportunity.
- Select a war candidate and open War Preview.
- Advance a year when no hard blocker exists.
- Review the annual report.
- Save and load successfully.

## 5. Regression guard

Before marking a build as ready, the workflow should pass at minimum:

- `commandExecutionPlan.test.ts`
- `actionPlanSummary.test.ts`
- `strategicHq.test.ts`
- `dashboardCommandGroups.test.ts`
- `governorAdvisor.test.ts`
- `releaseReadiness.test.ts`
- `onboardingCoach.test.ts`
- `turnRiskCenter.test.ts`
- `economyAdvisor.test.ts`
- `diplomacyAdvisor.test.ts`
- `warAssessment.test.ts`
- `warPreview.test.ts`
- `warOpportunityAdvisor.test.ts`
- `aiWarDecision.test.ts`
- `aiWarActionAdapter.test.ts`
- `aiWarPlannerIntegration.test.ts`

## 6. Release blockers

Do not tag a release if any of these are true:

- Pages opens to a blank screen.
- Dashboard command stack is missing.
- Save/load fails.
- Ending a turn crashes.
- War declaration or war preview crashes.
- Any required workflow is red.
- Old branch audit PRs still contain unreviewed release-critical changes.

## 7. Versioning rule

- V41: war assessment, war preview, AI war decision foundation.
- V42: deployed strategic command experience and release/preview pipeline.
- V43: economy/internal affairs advisor.
- V44: diplomacy advisor.
- V45: pre-turn risk center.
- V46: target coach / onboarding coach.
- V47-V49: governor advisor, dashboard grouping, release readiness.
- V52: main release documentation and QA hardening.
