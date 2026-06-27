# Preview build and deployment

Pull requests are validated with a Pages-compatible build. GitHub Pages deployment is reserved for `main` after the PR is merged.

## Public URL

https://lunora-gather.github.io/Imperium-Aeternum/

## Workflows

Pull requests use:

- `.github/workflows/pr-quality.yml`

It checks the PR, runs the regression suite, validates data, and builds with:

```bash
VITE_BASE=/Imperium-Aeternum/ npm run pages:build
```

`main` deployment uses:

- `.github/workflows/deploy-pages.yml`

It uploads `dist` to GitHub Pages after the build succeeds.

## Manual deploy

When the public page needs to be refreshed manually:

1. Open GitHub Actions.
2. Choose **Deploy Pages**.
3. Click **Run workflow**.
4. Open the Pages URL above after the run succeeds.

## What should be visible

The page should include the current V46/V45/V44 work:

- Dashboard Strategic HQ.
- Dashboard war opportunity summary.
- Dashboard economy advisor.
- Dashboard diplomacy advisor.
- Dashboard turn risk center.
- Dashboard onboarding coach.
- Military war opportunity advisor.
- War preview panel before declaring war.
- AI war assessment backed planner logic.
