# Preview deployment

The current optimized build is deployed through GitHub Pages from the `optimize/v39-action-plan` branch.

## Public URL

https://lunora-gather.github.io/Imperium-Aeternum/

## Workflow

The deployment workflow lives on `main`:

- `.github/workflows/deploy-preview-pages.yml`

It checks out `optimize/v39-action-plan`, runs typecheck and targeted tests, builds with:

```bash
VITE_BASE=/Imperium-Aeternum/ npm run pages:build
```

Then it uploads `dist` to GitHub Pages.

## Manual deploy

When the page needs to be refreshed manually:

1. Open GitHub Actions.
2. Choose **Deploy Imperium Aeternum Preview**.
3. Click **Run workflow**.
4. Open the Pages URL above after the run succeeds.

## What should be visible

The preview should include the current V41/V40 work:

- Dashboard Strategic HQ.
- Dashboard war opportunity summary.
- Military war opportunity advisor.
- War preview panel before declaring war.
- AI war assessment backed planner logic.
