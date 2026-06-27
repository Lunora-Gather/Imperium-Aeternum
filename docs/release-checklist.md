# Release checklist

Use this checklist whenever a new V42+ build is prepared for release.

## 1. Build source

Current release source branch:

- `main`

Current deployment workflow:

- `Deploy Pages`

Public URL:

- https://lunora-gather.github.io/Imperium-Aeternum/

## 2. Expected GitHub Actions state

The only workflow that should publish to the `github-pages` environment is:

- `Deploy Pages` on `main`

PR and branch workflows should build and test only. They should not deploy to the shared Pages environment.

## 3. Smoke test after deployment

Open the public URL and verify:

- The app loads without a blank page.
- Build marker shows the latest expected mark in dev-visible places if exposed.
- Dashboard opens normally.
- Dashboard includes Strategic HQ.
- Dashboard includes War Opportunity.
- Military screen opens normally.
- Military screen includes War Opportunity Advisor.
- Selecting a war candidate opens War Preview.
- Declaring war still works.
- Saving and loading still works.

## 4. Regression guard

Before marking a preview as ready, the workflow should pass:

- TypeScript typecheck.
- Full Vitest regression suite.
- Data and scenario validation.
- Pages-compatible production build.
- Strategic HQ tests.
- War assessment tests.
- War preview tests.
- War opportunity advisor tests.
- AI war decision tests.
- AI planner integration tests.

## 5. Versioning rule

- V41: war assessment, war preview, AI war decision foundation.
- V42: deployed strategic command experience and release/preview pipeline.
- V43+: next major gameplay/system stage.
