# Release checklist

Use this checklist whenever a new preview or release candidate build is prepared.

## 1. Build source

Current release source branch:

- `main` for public release.
- `optimize/v39-action-plan` for the active preview branch until merged.

Current deployment workflow:

- `Deploy Pages` on `main` for public release.
- `Deploy GitHub Pages` on the preview branch for active preview validation.

Public URL:

- https://lunora-gather.github.io/Imperium-Aeternum/

## 2. Expected GitHub Actions state

Before release, all required checks should be green:

- TypeScript typecheck.
- Full or targeted Vitest suite for changed systems.
- Data/scenario validation if touched.
- Pages-compatible production build.
- GitHub Pages deployment.

Only the final release branch should be treated as canonical. Preview branch deployment is allowed for validation, but release notes must clearly state which build marker is live.

## 3. Dashboard smoke test

Open the public URL and verify the Dashboard loads without a blank page. Then confirm the command stack is visible:

- Target Coach / 目标教练.
- Strategic HQ / 帝国总参.
- Pre-turn Risk Center / 推进前风险中枢.
- Economy Advisor / 经济内政顾问.
- Diplomacy Advisor / 外交顾问.
- War Opportunity / 战争机会.

## 4. Gameplay smoke test

Verify the core loop:

- Start or load a game.
- Open Dashboard.
- Follow the Target Coach first action.
- Inspect pre-turn blockers and warnings.
- Open Economy/Province page from an advisor action.
- Open Diplomacy page from an advisor action.
- Open Military page from a war opportunity.
- Select a war candidate and open War Preview.
- Advance a year when no hard blocker exists.
- Review the annual report.
- Save and load successfully.

## 5. Regression guard

Before marking a preview as ready, the workflow should pass at minimum:

- `commandExecutionPlan.test.ts`
- `actionPlanSummary.test.ts`
- `strategicHq.test.ts`
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
- The preview branch is still behind `main` without a reviewed merge plan.

## 7. Versioning rule

- V41: war assessment, war preview, AI war decision foundation.
- V42: deployed strategic command experience and release/preview pipeline.
- V43: economy/internal affairs advisor.
- V44: diplomacy advisor.
- V45: pre-turn risk center.
- V46: target coach / onboarding coach.
- V47: release hardening and documentation alignment.
